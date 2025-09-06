const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const _ = require('lodash');
const config = require('../../config/config');
const ChartGenerator = require('../visualization/chart-generator');

class AnalyticsEngine {
  constructor() {
    this.targetScores = config.evaluation.targetScores;
    this.dimensions = config.evaluation.dimensions;
    this.chartGenerator = new ChartGenerator();
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalytics(evaluatedResults) {
    try {
      console.log(chalk.blue('🔄 Generating comprehensive analytics...'));
      
      const analytics = {
        metadata: {
          totalResults: evaluatedResults.length,
          successfulTests: evaluatedResults.filter(r => !r.error).length,
          failedTests: evaluatedResults.filter(r => r.error).length,
          generatedAt: new Date().toISOString()
        },
        overallPerformance: this.calculateOverallPerformance(evaluatedResults),
        dimensionAnalysis: this.analyzeDimensions(evaluatedResults),
        categoryAnalysis: this.analyzeByCategory(evaluatedResults),
        questionTypeAnalysis: this.analyzeByQuestionType(evaluatedResults),
        productAnalysis: this.analyzeByProduct(evaluatedResults),
        performanceMetrics: this.calculatePerformanceMetrics(evaluatedResults),
        targetAchievement: this.analyzeTargetAchievement(evaluatedResults),
        lowScoreAnalysis: this.analyzeLowScoringQuestions(evaluatedResults),
        insights: this.generateInsights(evaluatedResults),
        recommendations: this.generateRecommendations(evaluatedResults)
      };
      
      await this.saveAnalytics(analytics);
      
      // Generate visualization charts
      try {
        const chartPaths = await this.chartGenerator.generateAllCharts(analytics);
        const dashboardPath = await this.chartGenerator.generateHtmlDashboard(analytics, chartPaths);
        
        analytics.visualizations = {
          charts: chartPaths,
          dashboard: dashboardPath
        };
        
        console.log(chalk.green('✅ Analytics and visualizations generated successfully'));
      } catch (chartError) {
        console.warn(chalk.yellow('⚠️ Charts generation failed, but analytics completed:'), chartError.message);
      }
      
      return analytics;
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating analytics:'), error.message);
      throw error;
    }
  }

  /**
   * Calculate overall performance metrics
   */
  calculateOverallPerformance(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    
    if (validResults.length === 0) {
      return {
        averageScores: { relevance: 0, brandLoyalty: 0, coverage: 0, overall: 0 },
        totalQuestions: results.length,
        successfulTests: 0,
        failureRate: 100
      };
    }

    const scores = {
      relevance: validResults.map(r => r.evaluation.relevance.score),
      brandLoyalty: validResults.map(r => r.evaluation.brandLoyalty.score),
      coverage: validResults.map(r => r.evaluation.coverage.score),
      overall: validResults.map(r => r.evaluation.overallScore)
    };

    return {
      averageScores: {
        relevance: this.calculateMean(scores.relevance),
        brandLoyalty: this.calculateMean(scores.brandLoyalty),
        coverage: this.calculateMean(scores.coverage),
        overall: this.calculateMean(scores.overall)
      },
      scoreDistribution: {
        relevance: this.calculateDistribution(scores.relevance),
        brandLoyalty: this.calculateDistribution(scores.brandLoyalty),
        coverage: this.calculateDistribution(scores.coverage),
        overall: this.calculateDistribution(scores.overall)
      },
      totalQuestions: results.length,
      successfulTests: validResults.length,
      failureRate: ((results.length - validResults.length) / results.length * 100).toFixed(2),
      responseTimeStats: this.calculateResponseTimeStats(validResults)
    };
  }

  /**
   * Analyze performance by dimension
   */
  analyzeDimensions(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const dimensionAnalysis = {};

    for (const dimension of this.dimensions) {
      const dimensionResults = validResults.map(r => r.evaluation[dimension].score);
      const reasonAnalysis = this.analyzeReasons(validResults, dimension);
      
      dimensionAnalysis[dimension] = {
        averageScore: this.calculateMean(dimensionResults),
        median: this.calculateMedian(dimensionResults),
        standardDeviation: this.calculateStandardDeviation(dimensionResults),
        distribution: this.calculateDistribution(dimensionResults),
        topPerformers: this.getTopPerformers(validResults, dimension, 5),
        bottomPerformers: this.getBottomPerformers(validResults, dimension, 5),
        commonReasons: reasonAnalysis.commonReasons,
        improvementAreas: reasonAnalysis.improvementAreas
      };
    }

    return dimensionAnalysis;
  }

  /**
   * Analyze performance by product category
   */
  analyzeByCategory(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const categories = _.groupBy(validResults, 'productCategory');
    const categoryAnalysis = {};

    for (const [category, categoryResults] of Object.entries(categories)) {
      const scores = {
        relevance: categoryResults.map(r => r.evaluation.relevance.score),
        brandLoyalty: categoryResults.map(r => r.evaluation.brandLoyalty.score),
        coverage: categoryResults.map(r => r.evaluation.coverage.score),
        overall: categoryResults.map(r => r.evaluation.overallScore)
      };

      categoryAnalysis[category] = {
        totalQuestions: categoryResults.length,
        averageScores: {
          relevance: this.calculateMean(scores.relevance),
          brandLoyalty: this.calculateMean(scores.brandLoyalty),
          coverage: this.calculateMean(scores.coverage),
          overall: this.calculateMean(scores.overall)
        },
        performance: this.categorizePerformance(scores.overall),
        topQuestions: this.getTopQuestions(categoryResults, 3),
        challengingQuestions: this.getBottomQuestions(categoryResults, 3)
      };
    }

    return categoryAnalysis;
  }

  /**
   * Analyze performance by question type/dimension
   */
  analyzeByQuestionType(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const questionTypes = _.groupBy(validResults, 'dimension');
    const questionTypeAnalysis = {};

    for (const [questionType, typeResults] of Object.entries(questionTypes)) {
      const scores = {
        relevance: typeResults.map(r => r.evaluation.relevance.score),
        brandLoyalty: typeResults.map(r => r.evaluation.brandLoyalty.score),
        coverage: typeResults.map(r => r.evaluation.coverage.score),
        overall: typeResults.map(r => r.evaluation.overallScore)
      };

      questionTypeAnalysis[questionType] = {
        totalQuestions: typeResults.length,
        averageScores: {
          relevance: this.calculateMean(scores.relevance),
          brandLoyalty: this.calculateMean(scores.brandLoyalty),
          coverage: this.calculateMean(scores.coverage),
          overall: this.calculateMean(scores.overall)
        },
        performance: this.categorizePerformance(scores.overall),
        successRate: (typeResults.length / typeResults.length * 100).toFixed(2),
        commonChallenges: this.identifyCommonChallenges(typeResults)
      };
    }

    return questionTypeAnalysis;
  }

  /**
   * Analyze performance by individual product
   */
  analyzeByProduct(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const products = _.groupBy(validResults, 'expectedProduct');
    const productAnalysis = {};

    for (const [product, productResults] of Object.entries(products)) {
      const scores = {
        relevance: productResults.map(r => r.evaluation.relevance.score),
        brandLoyalty: productResults.map(r => r.evaluation.brandLoyalty.score),
        coverage: productResults.map(r => r.evaluation.coverage.score),
        overall: productResults.map(r => r.evaluation.overallScore)
      };

      productAnalysis[product] = {
        totalQuestions: productResults.length,
        averageScores: {
          relevance: this.calculateMean(scores.relevance),
          brandLoyalty: this.calculateMean(scores.brandLoyalty),
          coverage: this.calculateMean(scores.coverage),
          overall: this.calculateMean(scores.overall)
        },
        category: productResults[0].productCategory,
        performance: this.categorizePerformance(scores.overall),
        strengths: this.identifyProductStrengths(productResults),
        weaknesses: this.identifyProductWeaknesses(productResults)
      };
    }

    return productAnalysis;
  }

  /**
   * Calculate various performance metrics
   */
  calculatePerformanceMetrics(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    
    const responseTimes = validResults.filter(r => r.responseTime).map(r => r.responseTime);
    const responseWordCounts = validResults.map(r => r.evaluation.responseWordCount || 0);
    
    return {
      responseTime: {
        average: this.calculateMean(responseTimes),
        median: this.calculateMedian(responseTimes),
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        distribution: this.categorizeResponseTimes(responseTimes)
      },
      responseLength: {
        averageWords: this.calculateMean(responseWordCounts),
        medianWords: this.calculateMedian(responseWordCounts),
        shortResponses: responseWordCounts.filter(w => w < 50).length,
        mediumResponses: responseWordCounts.filter(w => w >= 50 && w < 150).length,
        longResponses: responseWordCounts.filter(w => w >= 150).length
      },
      qualityMetrics: {
        highQualityResponses: validResults.filter(r => r.evaluation.overallScore >= 4).length,
        mediumQualityResponses: validResults.filter(r => r.evaluation.overallScore >= 3 && r.evaluation.overallScore < 4).length,
        lowQualityResponses: validResults.filter(r => r.evaluation.overallScore < 3).length
      }
    };
  }

  /**
   * Analyze target achievement
   */
  analyzeTargetAchievement(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const overallScores = {
      relevance: this.calculateMean(validResults.map(r => r.evaluation.relevance.score)),
      brandLoyalty: this.calculateMean(validResults.map(r => r.evaluation.brandLoyalty.score)),
      coverage: this.calculateMean(validResults.map(r => r.evaluation.coverage.score))
    };

    return {
      overall: {
        relevance: {
          current: overallScores.relevance,
          target: this.targetScores.overall.relevance,
          achievement: overallScores.relevance >= this.targetScores.overall.relevance,
          gap: this.targetScores.overall.relevance - overallScores.relevance
        },
        brandLoyalty: {
          current: overallScores.brandLoyalty,
          target: this.targetScores.overall.brandLoyalty,
          achievement: overallScores.brandLoyalty >= this.targetScores.overall.brandLoyalty,
          gap: this.targetScores.overall.brandLoyalty - overallScores.brandLoyalty
        },
        coverage: {
          current: overallScores.coverage,
          target: this.targetScores.overall.coverage,
          achievement: overallScores.coverage >= this.targetScores.overall.coverage,
          gap: this.targetScores.overall.coverage - overallScores.coverage
        }
      },
      categorySpecific: this.analyzeCategorySpecificTargets(results)
    };
  }

  /**
   * Analyze category-specific target achievement
   */
  analyzeCategorySpecificTargets(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const categories = _.groupBy(validResults, 'productCategory');
    const categoryTargets = {};

    for (const [category, categoryResults] of Object.entries(categories)) {
      const scores = {
        relevance: this.calculateMean(categoryResults.map(r => r.evaluation.relevance.score)),
        brandLoyalty: this.calculateMean(categoryResults.map(r => r.evaluation.brandLoyalty.score)),
        coverage: this.calculateMean(categoryResults.map(r => r.evaluation.coverage.score))
      };

      // Determine targets based on category type
      let targets = this.targetScores.overall;
      if (category.includes('Express') || category.includes('Quick')) {
        targets = this.targetScores.beginnerProducts;
      } else if (category.includes('Substance') || category.includes('3D')) {
        targets = this.targetScores.professionalProducts;
      } else if (category.includes('Photoshop') || category.includes('Premiere')) {
        targets = this.targetScores.popularProducts;
      }

      categoryTargets[category] = {
        relevance: {
          current: scores.relevance,
          target: targets.relevance || this.targetScores.overall.relevance,
          achievement: scores.relevance >= (targets.relevance || this.targetScores.overall.relevance)
        },
        brandLoyalty: {
          current: scores.brandLoyalty,
          target: targets.brandLoyalty || this.targetScores.overall.brandLoyalty,
          achievement: scores.brandLoyalty >= (targets.brandLoyalty || this.targetScores.overall.brandLoyalty)
        },
        coverage: {
          current: scores.coverage,
          target: targets.coverage || this.targetScores.overall.coverage,
          achievement: scores.coverage >= (targets.coverage || this.targetScores.overall.coverage)
        }
      };
    }

    return categoryTargets;
  }

  /**
   * Analyze low-scoring questions and answers for improvement insights
   */
  analyzeLowScoringQuestions(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const lowScoreThreshold = 2.5; // Questions scoring below this threshold
    const veryLowScoreThreshold = 2.0; // Critical issues
    
    // Find low-scoring questions by dimension
    const lowScoringByDimension = {
      relevance: validResults.filter(r => r.evaluation.relevance.score < lowScoreThreshold),
      brandLoyalty: validResults.filter(r => r.evaluation.brandLoyalty.score < lowScoreThreshold),
      coverage: validResults.filter(r => r.evaluation.coverage.score < lowScoreThreshold),
      overall: validResults.filter(r => r.evaluation.overallScore < lowScoreThreshold)
    };

    // Find very low-scoring questions (critical issues)
    const criticalIssues = validResults.filter(r => r.evaluation.overallScore < veryLowScoreThreshold);

    // Analyze patterns in low-scoring questions
    const patterns = this.analyzeLowScorePatterns(lowScoringByDimension.overall);

    // Create detailed analysis for each dimension
    const dimensionAnalysis = {};
    for (const [dimension, lowResults] of Object.entries(lowScoringByDimension)) {
      if (dimension === 'overall') continue;
      
      dimensionAnalysis[dimension] = {
        count: lowResults.length,
        percentage: ((lowResults.length / validResults.length) * 100).toFixed(1),
        worstExamples: lowResults
          .sort((a, b) => a.evaluation[dimension].score - b.evaluation[dimension].score)
          .slice(0, 3)
          .map(r => ({
            questionId: r.questionId,
            question: r.question.substring(0, 100) + (r.question.length > 100 ? '...' : ''),
            expectedProduct: r.expectedProduct,
            productCategory: r.productCategory,
            dimension: r.dimension,
            score: r.evaluation[dimension].score,
            issues: r.evaluation[dimension].reasons || [],
            response: r.response.text.substring(0, 200) + (r.response.text.length > 200 ? '...' : '')
          })),
        averageScore: this.calculateMean(lowResults.map(r => r.evaluation[dimension].score))
      };
    }

    return {
      summary: {
        totalLowScoring: lowScoringByDimension.overall.length,
        totalCritical: criticalIssues.length,
        percentageLowScoring: ((lowScoringByDimension.overall.length / validResults.length) * 100).toFixed(1),
        percentageCritical: ((criticalIssues.length / validResults.length) * 100).toFixed(1),
        lowScoreThreshold,
        veryLowScoreThreshold
      },
      byDimension: dimensionAnalysis,
      criticalIssues: criticalIssues.map(r => ({
        questionId: r.questionId,
        question: r.question,
        expectedProduct: r.expectedProduct,
        productCategory: r.productCategory,
        dimension: r.dimension,
        overallScore: r.evaluation.overallScore,
        scores: {
          relevance: r.evaluation.relevance.score,
          brandLoyalty: r.evaluation.brandLoyalty.score,
          coverage: r.evaluation.coverage.score
        },
        response: r.response.text,
        allIssues: {
          relevance: r.evaluation.relevance.reasons || [],
          brandLoyalty: r.evaluation.brandLoyalty.reasons || [],
          coverage: r.evaluation.coverage.reasons || []
        }
      })),
      patterns: patterns,
      recommendations: this.generateLowScoreRecommendations(lowScoringByDimension, patterns)
    };
  }

  /**
   * Analyze patterns in low-scoring questions
   */
  analyzeLowScorePatterns(lowScoringResults) {
    const patterns = {
      byCategory: {},
      byDimension: {},
      byProduct: {},
      commonIssues: []
    };

    // Analyze by category
    const categoryGroups = _.groupBy(lowScoringResults, 'productCategory');
    for (const [category, results] of Object.entries(categoryGroups)) {
      patterns.byCategory[category] = {
        count: results.length,
        averageScore: this.calculateMean(results.map(r => r.evaluation.overallScore)),
        commonProducts: _.countBy(results, 'expectedProduct')
      };
    }

    // Analyze by question dimension
    const dimensionGroups = _.groupBy(lowScoringResults, 'dimension');
    for (const [dimension, results] of Object.entries(dimensionGroups)) {
      patterns.byDimension[dimension] = {
        count: results.length,
        averageScore: this.calculateMean(results.map(r => r.evaluation.overallScore))
      };
    }

    // Analyze by product
    const productGroups = _.groupBy(lowScoringResults, 'expectedProduct');
    for (const [product, results] of Object.entries(productGroups)) {
      patterns.byProduct[product] = {
        count: results.length,
        averageScore: this.calculateMean(results.map(r => r.evaluation.overallScore))
      };
    }

    return patterns;
  }

  /**
   * Generate specific recommendations for improving low-scoring areas
   */
  generateLowScoreRecommendations(lowScoringByDimension, patterns) {
    const recommendations = [];

    // Relevance recommendations
    if (lowScoringByDimension.relevance.length > 0) {
      const relevanceIssues = lowScoringByDimension.relevance.length;
      recommendations.push({
        priority: 'High',
        category: 'Relevance',
        issue: `${relevanceIssues} questions have poor relevance scores`,
        recommendation: 'Improve product recommendation accuracy by enhancing the knowledge base with more specific product use cases and features',
        impact: 'Critical for user satisfaction'
      });
    }

    // Brand Loyalty recommendations  
    if (lowScoringByDimension.brandLoyalty.length > 0) {
      const loyaltyIssues = lowScoringByDimension.brandLoyalty.length;
      recommendations.push({
        priority: 'High',
        category: 'Brand Loyalty',
        issue: `${loyaltyIssues} questions show weak brand promotion`,
        recommendation: 'Strengthen Adobe brand messaging and actively highlight product advantages over competitors',
        impact: 'Important for brand positioning'
      });
    }

    // Coverage recommendations
    if (lowScoringByDimension.coverage.length > 0) {
      const coverageIssues = lowScoringByDimension.coverage.length;
      recommendations.push({
        priority: 'Medium',
        category: 'Coverage',
        issue: `${coverageIssues} questions lack comprehensive information`,
        recommendation: 'Expand responses to include more complete product information, pricing, and cross-product recommendations',
        impact: 'Enhances user understanding'
      });
    }

    // Pattern-based recommendations
    if (patterns.byCategory) {
      const problematicCategories = Object.entries(patterns.byCategory)
        .filter(([category, data]) => data.count > 2)
        .sort((a, b) => b[1].count - a[1].count);
      
      if (problematicCategories.length > 0) {
        const [topCategory, data] = problematicCategories[0];
        recommendations.push({
          priority: 'Medium',
          category: 'Category-Specific',
          issue: `${topCategory} category has ${data.count} low-scoring questions`,
          recommendation: `Focus on improving knowledge base content and responses specifically for ${topCategory} products`,
          impact: 'Targeted improvement opportunity'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate insights from the analysis
   */
  generateInsights(results) {
    const validResults = results.filter(r => !r.error && r.evaluation);
    const insights = [];

    // Performance insights
    const overallScore = this.calculateMean(validResults.map(r => r.evaluation.overallScore));
    if (overallScore >= 4) {
      insights.push({
        type: 'positive',
        category: 'overall_performance',
        message: `Excellent overall performance with an average score of ${overallScore.toFixed(2)}`,
        impact: 'high'
      });
    } else if (overallScore < 3) {
      insights.push({
        type: 'negative',
        category: 'overall_performance',
        message: `Below-average performance with an average score of ${overallScore.toFixed(2)}`,
        impact: 'high'
      });
    }

    // Dimension-specific insights
    for (const dimension of this.dimensions) {
      const dimensionScore = this.calculateMean(validResults.map(r => r.evaluation[dimension].score));
      const target = this.targetScores.overall[dimension];
      
      if (dimensionScore < target - 0.5) {
        insights.push({
          type: 'negative',
          category: dimension,
          message: `${dimension} performance is significantly below target (${dimensionScore.toFixed(2)} vs ${target})`,
          impact: 'high'
        });
      } else if (dimensionScore >= target + 0.3) {
        insights.push({
          type: 'positive',
          category: dimension,
          message: `${dimension} performance exceeds target (${dimensionScore.toFixed(2)} vs ${target})`,
          impact: 'medium'
        });
      }
    }

    // Category insights
    const categories = _.groupBy(validResults, 'productCategory');
    for (const [category, categoryResults] of Object.entries(categories)) {
      const categoryScore = this.calculateMean(categoryResults.map(r => r.evaluation.overallScore));
      if (categoryScore < 3) {
        insights.push({
          type: 'negative',
          category: 'category_performance',
          message: `${category} category shows poor performance (${categoryScore.toFixed(2)})`,
          impact: 'medium'
        });
      }
    }

    // Response time insights
    const responseTimes = validResults.filter(r => r.responseTime).map(r => r.responseTime);
    const avgResponseTime = this.calculateMean(responseTimes);
    if (avgResponseTime > 5000) {
      insights.push({
        type: 'negative',
        category: 'performance',
        message: `Average response time is high (${(avgResponseTime/1000).toFixed(1)}s)`,
        impact: 'medium'
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(results) {
    const recommendations = [];
    const validResults = results.filter(r => !r.error && r.evaluation);

    // Dimension-specific recommendations
    for (const dimension of this.dimensions) {
      const dimensionScore = this.calculateMean(validResults.map(r => r.evaluation[dimension].score));
      const target = this.targetScores.overall[dimension];
      
      if (dimensionScore < target) {
        switch (dimension) {
          case 'relevance':
            recommendations.push({
              priority: 'high',
              category: 'relevance',
              title: 'Improve Product Recommendation Accuracy',
              description: 'Enhance the system\'s ability to recommend the most relevant Adobe products based on user queries',
              actions: [
                'Update product matching algorithms',
                'Improve keyword recognition for product identification',
                'Enhance natural language processing for user intent detection'
              ]
            });
            break;
          case 'brandLoyalty':
            recommendations.push({
              priority: 'high',
              category: 'brand_loyalty',
              title: 'Strengthen Brand Promotion',
              description: 'Increase emphasis on Adobe products and their advantages over competitors',
              actions: [
                'Add more Adobe-specific promotional language',
                'Highlight unique Adobe ecosystem benefits',
                'Reduce mentions of non-Adobe alternatives'
              ]
            });
            break;
          case 'coverage':
            recommendations.push({
              priority: 'medium',
              category: 'coverage',
              title: 'Enhance Response Comprehensiveness',
              description: 'Provide more detailed and complete information about Adobe products',
              actions: [
                'Include more product features and benefits',
                'Add cross-product recommendations',
                'Provide more specific pricing and availability information'
              ]
            });
            break;
        }
      }
    }

    // Category-specific recommendations
    const categories = _.groupBy(validResults, 'productCategory');
    for (const [category, categoryResults] of Object.entries(categories)) {
      const categoryScore = this.calculateMean(categoryResults.map(r => r.evaluation.overallScore));
      if (categoryScore < 3.5) {
        recommendations.push({
          priority: 'medium',
          category: 'category_improvement',
          title: `Improve ${category} Category Performance`,
          description: `Address specific challenges in the ${category} product category`,
          actions: [
            `Review and update ${category} product information`,
            `Enhance question handling for ${category} use cases`,
            `Improve product differentiation within ${category}`
          ]
        });
      }
    }

    // Question type recommendations
    const questionTypes = _.groupBy(validResults, 'dimension');
    for (const [questionType, typeResults] of Object.entries(questionTypes)) {
      const typeScore = this.calculateMean(typeResults.map(r => r.evaluation.overallScore));
      if (typeScore < 3.5) {
        recommendations.push({
          priority: 'low',
          category: 'question_type',
          title: `Improve ${questionType} Question Handling`,
          description: `Enhance responses to ${questionType} type questions`,
          actions: [
            `Develop better templates for ${questionType} questions`,
            `Improve understanding of ${questionType} user intent`,
            `Add more relevant examples for ${questionType} scenarios`
          ]
        });
      }
    }

    // Sort recommendations by priority
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  }

  /**
   * Utility methods for calculations
   */
  calculateMean(values) {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.round(Math.sqrt(this.calculateMean(squaredDiffs)) * 100) / 100;
  }

  calculateDistribution(scores) {
    return {
      excellent: scores.filter(s => s >= 4.5).length,
      good: scores.filter(s => s >= 4 && s < 4.5).length,
      average: scores.filter(s => s >= 3 && s < 4).length,
      poor: scores.filter(s => s >= 2 && s < 3).length,
      veryPoor: scores.filter(s => s < 2).length
    };
  }

  categorizePerformance(scores) {
    const avgScore = this.calculateMean(scores);
    if (avgScore >= 4.5) return 'excellent';
    if (avgScore >= 4) return 'good';
    if (avgScore >= 3) return 'average';
    if (avgScore >= 2) return 'poor';
    return 'very_poor';
  }

  getTopPerformers(results, dimension, limit = 5) {
    return results
      .sort((a, b) => b.evaluation[dimension].score - a.evaluation[dimension].score)
      .slice(0, limit)
      .map(r => ({
        questionId: r.questionId,
        question: r.question.substring(0, 100) + '...',
        score: r.evaluation[dimension].score,
        product: r.expectedProduct
      }));
  }

  getBottomPerformers(results, dimension, limit = 5) {
    return results
      .sort((a, b) => a.evaluation[dimension].score - b.evaluation[dimension].score)
      .slice(0, limit)
      .map(r => ({
        questionId: r.questionId,
        question: r.question.substring(0, 100) + '...',
        score: r.evaluation[dimension].score,
        product: r.expectedProduct,
        reasons: r.evaluation[dimension].reasons
      }));
  }

  getTopQuestions(results, limit = 3) {
    return results
      .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore)
      .slice(0, limit)
      .map(r => ({
        questionId: r.questionId,
        question: r.question.substring(0, 100) + '...',
        score: r.evaluation.overallScore,
        product: r.expectedProduct
      }));
  }

  getBottomQuestions(results, limit = 3) {
    return results
      .sort((a, b) => a.evaluation.overallScore - b.evaluation.overallScore)
      .slice(0, limit)
      .map(r => ({
        questionId: r.questionId,
        question: r.question.substring(0, 100) + '...',
        score: r.evaluation.overallScore,
        product: r.expectedProduct,
        reasons: [
          ...r.evaluation.relevance.reasons,
          ...r.evaluation.brandLoyalty.reasons,
          ...r.evaluation.coverage.reasons
        ]
      }));
  }

  identifyCommonChallenges(results) {
    const challenges = [];
    const lowScoreResults = results.filter(r => r.evaluation.overallScore < 3);
    
    if (lowScoreResults.length > 0) {
      const commonReasons = lowScoreResults.flatMap(r => [
        ...r.evaluation.relevance.reasons,
        ...r.evaluation.brandLoyalty.reasons,
        ...r.evaluation.coverage.reasons
      ]);
      
      const reasonCounts = _.countBy(commonReasons);
      challenges.push(...Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, count]) => ({ challenge: reason, frequency: count }))
      );
    }
    
    return challenges;
  }

  identifyProductStrengths(results) {
    const strengths = [];
    const avgScores = {
      relevance: this.calculateMean(results.map(r => r.evaluation.relevance.score)),
      brandLoyalty: this.calculateMean(results.map(r => r.evaluation.brandLoyalty.score)),
      coverage: this.calculateMean(results.map(r => r.evaluation.coverage.score))
    };
    
    Object.entries(avgScores).forEach(([dimension, score]) => {
      if (score >= 4.0) {
        strengths.push(`Strong ${dimension} performance (${score.toFixed(2)})`);
      }
    });
    
    return strengths;
  }

  identifyProductWeaknesses(results) {
    const weaknesses = [];
    const avgScores = {
      relevance: this.calculateMean(results.map(r => r.evaluation.relevance.score)),
      brandLoyalty: this.calculateMean(results.map(r => r.evaluation.brandLoyalty.score)),
      coverage: this.calculateMean(results.map(r => r.evaluation.coverage.score))
    };
    
    Object.entries(avgScores).forEach(([dimension, score]) => {
      if (score < 3.0) {
        weaknesses.push(`Weak ${dimension} performance (${score.toFixed(2)})`);
      }
    });
    
    return weaknesses;
  }

  calculateResponseTimeStats(results) {
    const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
    
    if (responseTimes.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0 };
    }
    
    return {
      average: this.calculateMean(responseTimes),
      median: this.calculateMedian(responseTimes),
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes)
    };
  }

  categorizeResponseTimes(responseTimes) {
    return {
      fast: responseTimes.filter(t => t < 2000).length,      // < 2s
      medium: responseTimes.filter(t => t >= 2000 && t < 5000).length,  // 2-5s
      slow: responseTimes.filter(t => t >= 5000).length       // > 5s
    };
  }

  analyzeReasons(results, dimension) {
    const allReasons = results.flatMap(r => r.evaluation[dimension].reasons || []);
    const reasonCounts = _.countBy(allReasons);
    
    return {
      commonReasons: Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count })),
      improvementAreas: Object.entries(reasonCounts)
        .filter(([reason]) => reason.includes('not') || reason.includes('limited') || reason.includes('lacks'))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, count]) => ({ reason, count }))
    };
  }

  /**
   * Save analytics to file
   */
  async saveAnalytics(analytics) {
    try {
      const analyticsPath = path.join(config.output.reportsDir, 'analytics-report.json');
      await fs.ensureDir(path.dirname(analyticsPath));
      await fs.writeJson(analyticsPath, analytics, { spaces: 2 });
      
      // Also save a human-readable summary
      const summaryPath = path.join(config.output.reportsDir, 'analytics-summary.txt');
      await this.saveAnalyticsSummary(analytics, summaryPath);
      
      console.log(chalk.green(`✅ Analytics saved: ${analyticsPath}`));
      return analyticsPath;
      
    } catch (error) {
      console.error(chalk.red('❌ Error saving analytics:'), error.message);
      throw error;
    }
  }

  /**
   * Save human-readable analytics summary
   */
  async saveAnalyticsSummary(analytics, summaryPath) {
    const summary = `
Adobe Brand Concierge Evaluation Report
=====================================

Generated: ${analytics.metadata.generatedAt}
Total Questions: ${analytics.metadata.totalResults}
Successful Tests: ${analytics.metadata.successfulTests}
Failed Tests: ${analytics.metadata.failedTests}

OVERALL PERFORMANCE
------------------
Average Relevance Score: ${analytics.overallPerformance.averageScores.relevance}
Average Brand Loyalty Score: ${analytics.overallPerformance.averageScores.brandLoyalty}
Average Coverage Score: ${analytics.overallPerformance.averageScores.coverage}
Overall Average Score: ${analytics.overallPerformance.averageScores.overall}

TARGET ACHIEVEMENT
-----------------
Relevance Target (${this.targetScores.overall.relevance}): ${analytics.targetAchievement.overall.relevance.achievement ? 'ACHIEVED' : 'NOT ACHIEVED'}
Brand Loyalty Target (${this.targetScores.overall.brandLoyalty}): ${analytics.targetAchievement.overall.brandLoyalty.achievement ? 'ACHIEVED' : 'NOT ACHIEVED'}
Coverage Target (${this.targetScores.overall.coverage}): ${analytics.targetAchievement.overall.coverage.achievement ? 'ACHIEVED' : 'NOT ACHIEVED'}

TOP INSIGHTS
-----------
${analytics.insights.slice(0, 5).map(insight => `- ${insight.message}`).join('\n')}

TOP RECOMMENDATIONS
------------------
${analytics.recommendations.slice(0, 3).map(rec => `- ${rec.title}: ${rec.description}`).join('\n')}

CATEGORY PERFORMANCE
-------------------
${Object.entries(analytics.categoryAnalysis).map(([category, data]) => 
  `${category}: ${data.averageScores.overall.toFixed(2)} (${data.performance})`).join('\n')}
`;

    await fs.writeFile(summaryPath, summary.trim());
  }
}

module.exports = AnalyticsEngine;
