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
        accuracyIndicators: [
          'specifically', 'exactly', 'perfect for', 'designed for', 'ideal for',
          'top choice', 'excellent for', 'specializes in', 'widely used', 'great for',
          'best suited', 'recommended', 'optimal for', 'tailored to', 'focused on',
          'best', 'finest', 'premier', 'leading', 'go-to', 'industry-standard',
          'powerful tools', 'professional-grade', 'top picks', 'offers'
        ],
        incorrectIndicators: ['not suitable', 'not recommended', 'wrong choice', 'not ideal'],
        detailIndicators: [
          'features include', 'capabilities', 'designed to', 'allows you to',
          'vector graphics', 'raster images', 'photo-based', 'digital painting',
          'scalable artwork', 'detailed', 'professional', 'advanced tools'
        ]
      },
      brandLoyalty: {
        adobePromotionWords: ['adobe', 'creative cloud', 'industry standard', 'professional choice'],
        advantageWords: [
          'better than', 'superior to', 'industry leader', 'best choice',
          'top choice', 'excellent', 'widely used', 'professional', 'leading',
          'premier', 'renowned', 'trusted', 'preferred', 'go-to tool',
          'excellent choice', 'perfect for', 'ideal for', 'designed to', 'streamlined'
        ],
        competitorMentions: ['alternative', 'competitor', 'other options'],
        loyaltyPhrases: [
          'adobe ecosystem', 'adobe family', 'seamless integration',
          'widely used by artists', 'professional digital artwork creation',
          'trusted by professionals', 'industry standard', 'creative professionals',
          'widely used by professionals', 'industry-standard', 'professional workflows',
          'document workflows', 'professional tool', 'professional PDF'
        ]
      },
      coverage: {
        comprehensiveWords: [
          'comprehensive', 'complete', 'full suite', 'everything you need',
          'multiple options', 'different needs', 'various', 'range of',
          'depending on', 'if you prefer', 'alternatively', 'additionally',
          'comprehensive tools', 'wide range', 'extensive', 'thorough',
          'all-in-one', 'robust', 'powerful', 'full-featured', 'versatile'
        ],
        crossProductWords: [
          'also recommend', 'works with', 'integrates with', 'compatible with',
          'both apps', 'multiple products', 'different tools', 'various options',
          'illustrator', 'photoshop', 'firefly', 'suite of tools'
        ],
        helpfulLanguage: [
          'are you looking for', 'would you prefer', 'do you need',
          'which type', 'what kind', 'more suited to', 'better for',
          'depending on your', 'based on your needs',
          'would you like tips', 'would you like help', 'need assistance',
          'let me know if', 'happy to help', 'can help you',
          'would you like to know', 'would you like more', 'want to learn',
          'interested in', 'need more information', 'any questions'
        ],
        missingInfoIndicators: ['for more information', 'visit website', 'contact sales'],
        accurateInfoIndicators: [
          'priced at', 'available for', 'includes features', 'system requirements',
          'vector graphics', 'raster images', 'scalable', 'pixel-based',
          'workflow', 'process', 'handling', 'efficiently', 'organize', 'batch',
          'creating', 'editing', 'converting', 'managing', 'digital signatures', 
          'form creation', 'collaboration tools', 'advanced features', 'capabilities',
          'industry-standard', 'widely used', 'professionals', 'document workflows'
        ]
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
    
    // Enhanced product matching - reward comprehensive responses
    const expectedProductMentioned = responseTextLower.includes(expectedProduct);
    
    // NEW: Product family matching - recognize core products across licensing tiers
    const expectedCoreProduct = this.getCoreProductName(testResult.expectedProduct);
    const coreProductMentioned = responseTextLower.includes(expectedCoreProduct.toLowerCase());
    
    const categoryKeywords = this.getCategoryKeywords(category);
    const mentionedCategoryProducts = categoryKeywords.filter(keyword => 
      responseTextLower.includes(keyword.toLowerCase())
    );
    
    // Count Adobe products mentioned (more comprehensive = better)
    const adobeProducts = ['photoshop', 'illustrator', 'premiere', 'after effects', 'lightroom', 
                          'indesign', 'acrobat', 'express', 'firefly', 'audition', 'animate'];
    const mentionedProducts = adobeProducts.filter(product => responseTextLower.includes(product));
    
    if (expectedProductMentioned) {
      score += 1.5;
      reasons.push(`Correctly mentions ${testResult.expectedProduct}`);
    } else if (coreProductMentioned && expectedCoreProduct !== testResult.expectedProduct) {
      // Core product mentioned (e.g., "Lightroom" for "Lightroom for Teams")
      score += 1.4; // Almost as good as exact match
      reasons.push(`Correctly identifies core product (${expectedCoreProduct})`);
    } else if (mentionedCategoryProducts.length > 0) {
      score += 0.8; // Increased from 0.5 for category relevance
      reasons.push('Mentions relevant product category');
    } else {
      reasons.push('Does not mention expected product or category');
    }
    
    // Bonus for comprehensive multi-product responses (better than single product!)
    if (mentionedProducts.length >= 3) {
      score += 0.7; // Bonus for comprehensive guidance
      reasons.push(`Comprehensive response covering ${mentionedProducts.length} products`);
    } else if (mentionedProducts.length >= 2) {
      score += 0.4; // Moderate bonus for multiple products
      reasons.push(`Multiple product options provided (${mentionedProducts.length} products)`);
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
    
    // Bonus for professional presentation and quality guidance
    const professionalIndicators = ['professional-grade', 'industry-standard', 'powerful tools', 
                                  'advanced features', 'comprehensive', 'offers several', 'tailored to',
                                  'comprehensive tools', 'document workflows', 'professional tool',
                                  'widely used', 'capabilities', 'managing', 'collaboration'];
    const professionalCount = this.countMatches(responseTextLower, professionalIndicators);
    if (professionalCount > 0) {
      score += Math.min(1.0, professionalCount * 0.2); // Increased max bonus from 0.8 to 1.0
      reasons.push(`Professional presentation with ${professionalCount} quality indicators`);
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
    
    // Check for helpful, user-focused language  
    const helpfulLanguageCount = this.countMatches(responseTextLower, this.evaluationCriteria.coverage.helpfulLanguage);
    if (helpfulLanguageCount > 0) {
      score += Math.min(1, helpfulLanguageCount * 0.4);
      reasons.push(`Uses ${helpfulLanguageCount} helpful user-focused phrases`);
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
   * Extract core product name from product variations (e.g., "Lightroom for Teams" -> "Lightroom")
   */
  getCoreProductName(productName) {
    if (!productName) return '';
    
    // Remove common licensing/tier suffixes to get core product name
    const suffixesToRemove = [
      ' for Teams',
      ' for Students and Teachers', 
      ' for Enterprise',
      ' CC',
      ' Creative Cloud'
    ];
    
    let coreName = productName;
    for (const suffix of suffixesToRemove) {
      if (coreName.includes(suffix)) {
        coreName = coreName.replace(suffix, '');
        break; // Only remove the first matching suffix
      }
    }
    
    // Handle special cases
    const specialCases = {
      'Creative Cloud All Apps Plan': 'Creative Cloud All Apps',
      'Creative Cloud Photo Plan': 'Lightroom',
      'Substance 3D Collection': 'Substance 3D'
    };
    
    if (specialCases[productName]) {
      return specialCases[productName];
    }
    
    return coreName.trim();
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
