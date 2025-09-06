const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('../../config/config');

class ResponseEvaluator {
  constructor() {
    this.dimensions = config.evaluation.dimensions;
    this.scoreRange = config.evaluation.scoreRange;
    this.evaluationResults = [];
    
    // Keywords and patterns for evaluation
    this.evaluationCriteria = {
      relevance: {
        productMentions: [],
        accuracyIndicators: ['specifically', 'exactly', 'perfect for', 'designed for', 'ideal for'],
        incorrectIndicators: ['not suitable', 'not recommended', 'wrong choice', 'not ideal'],
        detailIndicators: ['features include', 'capabilities', 'designed to', 'allows you to']
      },
      brandLoyalty: {
        adobePromotionWords: ['adobe', 'creative cloud', 'industry standard', 'professional choice'],
        advantageWords: ['better than', 'superior to', 'industry leader', 'best choice'],
        competitorMentions: ['alternative', 'competitor', 'other options'],
        loyaltyPhrases: ['adobe ecosystem', 'adobe family', 'seamless integration']
      },
      coverage: {
        comprehensiveWords: ['comprehensive', 'complete', 'full suite', 'everything you need'],
        crossProductWords: ['also recommend', 'works with', 'integrates with', 'compatible with'],
        missingInfoIndicators: ['for more information', 'visit website', 'contact sales'],
        accurateInfoIndicators: ['priced at', 'available for', 'includes features', 'system requirements']
      }
    };
  }

  /**
   * Evaluate all test results
   */
  async evaluateResults(testResults) {
    try {
      console.log(chalk.blue(`🔄 Evaluating ${testResults.length} test results...`));
      
      const evaluatedResults = [];
      
      for (const result of testResults) {
        if (result.error) {
          // Skip failed tests
          evaluatedResults.push({
            ...result,
            evaluation: {
              relevance: { score: 0, reason: 'Test failed - no response to evaluate' },
              brandLoyalty: { score: 0, reason: 'Test failed - no response to evaluate' },
              coverage: { score: 0, reason: 'Test failed - no response to evaluate' },
              overallScore: 0,
              evaluatedAt: new Date().toISOString()
            }
          });
          continue;
        }
        
        const evaluation = this.evaluateResponse(result);
        evaluatedResults.push({
          ...result,
          evaluation
        });
      }
      
      console.log(chalk.green(`✅ Evaluation completed for ${evaluatedResults.length} results`));
      
      // Save evaluated results
      await this.saveEvaluatedResults(evaluatedResults);
      
      return evaluatedResults;
      
    } catch (error) {
      console.error(chalk.red('❌ Error evaluating results:'), error.message);
      throw error;
    }
  }

  /**
   * Evaluate a single response across all dimensions
   */
  evaluateResponse(testResult) {
    const response = testResult.response;
    const responseText = response?.text || '';
    
    if (!responseText) {
      return {
        relevance: { score: 1, reason: 'No response text available' },
        brandLoyalty: { score: 1, reason: 'No response text available' },
        coverage: { score: 1, reason: 'No response text available' },
        overallScore: 1,
        evaluatedAt: new Date().toISOString()
      };
    }

    // Evaluate each dimension
    const relevanceEval = this.evaluateRelevance(testResult, responseText);
    const brandLoyaltyEval = this.evaluateBrandLoyalty(testResult, responseText);
    const coverageEval = this.evaluateCoverage(testResult, responseText);
    
    // Calculate overall score
    const overallScore = Math.round((relevanceEval.score + brandLoyaltyEval.score + coverageEval.score) / 3 * 100) / 100;
    
    return {
      relevance: relevanceEval,
      brandLoyalty: brandLoyaltyEval,
      coverage: coverageEval,
      overallScore: overallScore,
      evaluatedAt: new Date().toISOString(),
      responseLength: responseText.length,
      responseWordCount: responseText.split(/\s+/).length
    };
  }

  /**
   * Evaluate relevance dimension
   */
  evaluateRelevance(testResult, responseText) {
    const expectedProduct = testResult.expectedProduct.toLowerCase();
    const category = testResult.productCategory.toLowerCase();
    const dimension = testResult.dimension;
    const questionText = testResult.question.toLowerCase();
    const responseTextLower = responseText.toLowerCase();
    
    let score = 1;
    let reasons = [];
    
    // Check if the expected product is mentioned
    if (responseTextLower.includes(expectedProduct)) {
      score += 1.5;
      reasons.push(`Correctly mentions ${testResult.expectedProduct}`);
    } else {
      // Check if category-related products are mentioned
      const categoryKeywords = this.getCategoryKeywords(category);
      const mentionedCategory = categoryKeywords.some(keyword => 
        responseTextLower.includes(keyword.toLowerCase())
      );
      
      if (mentionedCategory) {
        score += 0.5;
        reasons.push('Mentions relevant product category');
      } else {
        reasons.push('Does not mention expected product or category');
      }
    }
    
    // Check for accuracy indicators
    const accuracyCount = this.countMatches(responseTextLower, this.evaluationCriteria.relevance.accuracyIndicators);
    if (accuracyCount > 0) {
      score += Math.min(1, accuracyCount * 0.3);
      reasons.push(`Shows ${accuracyCount} accuracy indicators`);
    }
    
    // Check for incorrect indicators (penalty)
    const incorrectCount = this.countMatches(responseTextLower, this.evaluationCriteria.relevance.incorrectIndicators);
    if (incorrectCount > 0) {
      score -= incorrectCount * 0.5;
      reasons.push(`Contains ${incorrectCount} incorrect indicators`);
    }
    
    // Check for detail level
    const detailCount = this.countMatches(responseTextLower, this.evaluationCriteria.relevance.detailIndicators);
    if (detailCount > 0) {
      score += Math.min(0.5, detailCount * 0.1);
      reasons.push(`Provides detailed information (${detailCount} detail indicators)`);
    }
    
    // Dimension-specific evaluation
    score += this.evaluateDimensionSpecific(dimension, questionText, responseTextLower);
    
    // Ensure score is within range
    score = Math.max(1, Math.min(5, score));
    
    return {
      score: Math.round(score * 10) / 10,
      reasons: reasons,
      breakdown: {
        productMention: responseTextLower.includes(expectedProduct),
        accuracyIndicators: accuracyCount,
        incorrectIndicators: incorrectCount,
        detailLevel: detailCount
      }
    };
  }

  /**
   * Evaluate brand loyalty dimension
   */
  evaluateBrandLoyalty(testResult, responseText) {
    const responseTextLower = responseText.toLowerCase();
    
    let score = 1;
    let reasons = [];
    
    // Check for Adobe promotion
    const adobeMentions = this.countMatches(responseTextLower, this.evaluationCriteria.brandLoyalty.adobePromotionWords);
    if (adobeMentions > 0) {
      score += Math.min(1.5, adobeMentions * 0.3);
      reasons.push(`Mentions Adobe/Creative Cloud ${adobeMentions} times`);
    } else {
      reasons.push('Limited Adobe brand promotion');
    }
    
    // Check for advantage language
    const advantageCount = this.countMatches(responseTextLower, this.evaluationCriteria.brandLoyalty.advantageWords);
    if (advantageCount > 0) {
      score += Math.min(1, advantageCount * 0.4);
      reasons.push(`Uses ${advantageCount} advantage-promoting phrases`);
    }
    
    // Check for competitor mentions (neutral or negative impact)
    const competitorCount = this.countMatches(responseTextLower, this.evaluationCriteria.brandLoyalty.competitorMentions);
    if (competitorCount > 0) {
      score -= Math.min(1, competitorCount * 0.2);
      reasons.push(`Mentions competitors ${competitorCount} times`);
    }
    
    // Check for loyalty phrases
    const loyaltyCount = this.countMatches(responseTextLower, this.evaluationCriteria.brandLoyalty.loyaltyPhrases);
    if (loyaltyCount > 0) {
      score += Math.min(0.8, loyaltyCount * 0.4);
      reasons.push(`Uses ${loyaltyCount} brand loyalty phrases`);
    }
    
    // Check if response actively promotes Adobe vs alternatives
    if (responseTextLower.includes('choose adobe') || responseTextLower.includes('adobe is better')) {
      score += 0.5;
      reasons.push('Actively promotes Adobe choice');
    }
    
    // Penalty for recommending non-Adobe alternatives
    const nonAdobeProducts = ['gimp', 'canva', 'figma', 'sketch', 'final cut', 'davinci'];
    const nonAdobeMentions = this.countMatches(responseTextLower, nonAdobeProducts);
    if (nonAdobeMentions > 0) {
      score -= nonAdobeMentions * 0.5;
      reasons.push(`Mentions ${nonAdobeMentions} non-Adobe alternatives`);
    }
    
    // Ensure score is within range
    score = Math.max(1, Math.min(5, score));
    
    return {
      score: Math.round(score * 10) / 10,
      reasons: reasons,
      breakdown: {
        adobeMentions: adobeMentions,
        advantageLanguage: advantageCount,
        competitorMentions: competitorCount,
        loyaltyPhrases: loyaltyCount,
        nonAdobeAlternatives: nonAdobeMentions
      }
    };
  }

  /**
   * Evaluate coverage dimension
   */
  evaluateCoverage(testResult, responseText) {
    const responseTextLower = responseText.toLowerCase();
    const expectedProduct = testResult.expectedProduct.toLowerCase();
    
    let score = 1;
    let reasons = [];
    
    // Check response length (comprehensive responses tend to be longer)
    const wordCount = responseText.split(/\s+/).length;
    if (wordCount > 100) {
      score += 1;
      reasons.push('Comprehensive response length');
    } else if (wordCount > 50) {
      score += 0.5;
      reasons.push('Adequate response length');
    } else {
      reasons.push('Brief response - may lack detail');
    }
    
    // Check for comprehensive language
    const comprehensiveCount = this.countMatches(responseTextLower, this.evaluationCriteria.coverage.comprehensiveWords);
    if (comprehensiveCount > 0) {
      score += Math.min(0.5, comprehensiveCount * 0.2);
      reasons.push(`Uses ${comprehensiveCount} comprehensive language indicators`);
    }
    
    // Check for cross-product recommendations
    const crossProductCount = this.countMatches(responseTextLower, this.evaluationCriteria.coverage.crossProductWords);
    if (crossProductCount > 0) {
      score += Math.min(1, crossProductCount * 0.3);
      reasons.push(`Makes ${crossProductCount} cross-product recommendations`);
    }
    
    // Check for missing information indicators (penalty)
    const missingInfoCount = this.countMatches(responseTextLower, this.evaluationCriteria.coverage.missingInfoIndicators);
    if (missingInfoCount > 0) {
      score -= Math.min(1, missingInfoCount * 0.3);
      reasons.push(`Contains ${missingInfoCount} "missing info" indicators`);
    }
    
    // Check for accurate/specific information
    const accurateInfoCount = this.countMatches(responseTextLower, this.evaluationCriteria.coverage.accurateInfoIndicators);
    if (accurateInfoCount > 0) {
      score += Math.min(0.8, accurateInfoCount * 0.2);
      reasons.push(`Provides ${accurateInfoCount} specific/accurate details`);
    }
    
    // Check if multiple Adobe products are mentioned (ecosystem coverage)
    const adobeProducts = ['photoshop', 'illustrator', 'premiere', 'after effects', 'lightroom', 'indesign', 'acrobat', 'express'];
    const mentionedProducts = adobeProducts.filter(product => responseTextLower.includes(product)).length;
    if (mentionedProducts > 1) {
      score += Math.min(1, (mentionedProducts - 1) * 0.2);
      reasons.push(`Mentions ${mentionedProducts} Adobe products`);
    }
    
    // Ensure score is within range
    score = Math.max(1, Math.min(5, score));
    
    return {
      score: Math.round(score * 10) / 10,
      reasons: reasons,
      breakdown: {
        wordCount: wordCount,
        comprehensiveLanguage: comprehensiveCount,
        crossProductRefs: crossProductCount,
        missingInfoIndicators: missingInfoCount,
        accurateInfoIndicators: accurateInfoCount,
        productMentions: mentionedProducts
      }
    };
  }

  /**
   * Evaluate dimension-specific criteria
   */
  evaluateDimensionSpecific(dimension, questionText, responseText) {
    let bonus = 0;
    
    switch (dimension) {
      case 'basicProductIdentification':
        if (responseText.includes('recommend') || responseText.includes('suggest')) {
          bonus += 0.2;
        }
        break;
        
      case 'useCaseMatching':
        if (responseText.includes('perfect for') || responseText.includes('ideal for')) {
          bonus += 0.3;
        }
        break;
        
      case 'skillLevelMatching':
        if (responseText.includes('beginner') || responseText.includes('advanced') || responseText.includes('professional')) {
          bonus += 0.2;
        }
        break;
        
      case 'budgetAndPricing':
        if (responseText.includes('$') || responseText.includes('price') || responseText.includes('cost') || responseText.includes('budget')) {
          bonus += 0.4;
        }
        break;
        
      case 'competitorComparison':
        if (responseText.includes('advantage') || responseText.includes('better') || responseText.includes('superior')) {
          bonus += 0.3;
        }
        break;
    }
    
    return bonus;
  }

  /**
   * Get category-specific keywords
   */
  getCategoryKeywords(category) {
    const keywordMap = {
      'creative design': ['photoshop', 'illustrator', 'indesign', 'design', 'creative'],
      'video production': ['premiere', 'after effects', 'video', 'editing', 'motion'],
      'audio processing': ['audition', 'audio', 'sound'],
      'pdf processing': ['acrobat', 'pdf', 'document'],
      'photography': ['lightroom', 'photography', 'photo'],
      '3d creation': ['substance', '3d', 'modeling', 'rendering'],
      'quick design': ['express', 'quick', 'easy', 'simple'],
      'bundle plans': ['creative cloud', 'all apps', 'suite', 'bundle']
    };
    
    return keywordMap[category] || [];
  }

  /**
   * Count matches of keywords/phrases in text
   */
  countMatches(text, keywords) {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Save evaluated results
   */
  async saveEvaluatedResults(evaluatedResults) {
    try {
      const resultsPath = path.join(config.output.resultsDir, 'evaluated-results.json');
      
      const saveData = {
        metadata: {
          totalResults: evaluatedResults.length,
          evaluationDimensions: this.dimensions,
          scoreRange: this.scoreRange,
          evaluatedAt: new Date().toISOString(),
          evaluationCriteria: this.evaluationCriteria
        },
        results: evaluatedResults
      };
      
      await fs.ensureDir(path.dirname(resultsPath));
      await fs.writeJson(resultsPath, saveData, { spaces: 2 });
      
      console.log(chalk.green(`✅ Evaluated results saved: ${resultsPath}`));
      return resultsPath;
      
    } catch (error) {
      console.error(chalk.red('❌ Error saving evaluated results:'), error.message);
      throw error;
    }
  }

  /**
   * Load evaluated results from file
   */
  async loadEvaluatedResults() {
    try {
      const resultsPath = path.join(config.output.resultsDir, 'evaluated-results.json');
      if (await fs.pathExists(resultsPath)) {
        const data = await fs.readJson(resultsPath);
        console.log(chalk.green(`✅ Loaded ${data.metadata.totalResults} evaluated results`));
        return data.results;
      }
      return null;
    } catch (error) {
      console.error(chalk.red('❌ Error loading evaluated results:'), error.message);
      throw error;
    }
  }
}

module.exports = ResponseEvaluator;
