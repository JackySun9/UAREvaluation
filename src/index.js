#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { program } = require('commander');

// Import system components
const ProductFetcher = require('./data-fetcher/product-fetcher');
const GoldenQuestionGenerator = require('./question-generator/golden-questions');
const BrandConciergeTester = require('./automation/brand-concierge-tester');
const ResponseEvaluator = require('./evaluation/response-evaluator');
const AnalyticsEngine = require('./analytics/analytics-engine');
const config = require('../config/config');

class UAREvaluationSystem {
  constructor() {
    this.productFetcher = new ProductFetcher();
    this.questionGenerator = new GoldenQuestionGenerator();
    this.tester = new BrandConciergeTester();
    this.evaluator = new ResponseEvaluator();
    this.analytics = new AnalyticsEngine();
    
    this.sessionId = `evaluation-${Date.now()}`;
    this.results = {
      products: [],
      questions: [],
      testResults: [],
      evaluatedResults: [],
      analytics: {}
    };
  }

  /**
   * Run the complete evaluation pipeline
   */
  async runCompleteEvaluation(options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(chalk.blue.bold('🚀 Starting Adobe Brand Concierge Evaluation System'));
      console.log(chalk.gray(`Session ID: ${this.sessionId}`));
      console.log(chalk.gray('='.repeat(80)));

      // Step 1: Fetch product data
      await this.fetchProductData(options.refreshProducts);
      
      // Step 2: Generate questions
      await this.generateQuestions(options.regenerateQuestions);
      
      // Step 3: Run automated testing
      if (!options.skipTesting) {
        await this.runAutomatedTesting(options.questionLimit, options.useParallel);
      }
      
      // Step 4: Evaluate responses
      if (!options.skipEvaluation) {
        await this.evaluateResponses();
      }
      
      // Step 5: Generate analytics
      if (!options.skipAnalytics) {
        await this.generateAnalytics();
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      console.log(chalk.green.bold('\n🎉 Evaluation completed successfully!'));
      console.log(chalk.gray(`Total time: ${totalTime.toFixed(1)}s`));
      
      await this.generateFinalReport();
      
      return this.results;
      
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Evaluation failed:'), error.message);
      console.error(chalk.red(error.stack));
      throw error;
    }
  }

  /**
   * Run only the testing phase (for CLI command)
   */
  async runTestingOnly(questionLimit = null, useParallel = false) {
    try {
      console.log(chalk.blue.bold('🤖 Adobe Brand Concierge Testing Only'));
      console.log(chalk.gray(`Session ID: ${this.sessionId}`));
      console.log(chalk.gray('='.repeat(80)));
      if (useParallel) {
        console.log(chalk.yellow('⚡ Parallel processing enabled'));
      }

      // Load existing products and questions
      await this.fetchProductData(false);
      await this.generateQuestions(false);
      
      // Run testing with optional parallel processing
      await this.runAutomatedTesting(questionLimit, useParallel);
      
      console.log(chalk.green.bold('\n🎉 Testing completed successfully!'));
      
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Testing failed:'), error.message);
      throw error;
    }
  }

  /**
   * Step 1: Fetch and parse product data
   */
  async fetchProductData(refresh = false) {
    try {
      console.log(chalk.blue('\n📦 Step 1: Fetching Adobe Product Data'));
      console.log(chalk.gray('-'.repeat(50)));
      
      let productData;
      if (refresh) {
        productData = await this.productFetcher.refreshProductData();
      } else {
        productData = await this.productFetcher.loadProductData();
      }
      
      const parsedData = this.productFetcher.parseProductData(productData);
      this.results.products = parsedData.products;
      
      console.log(chalk.green(`✅ Successfully loaded ${parsedData.totalCount} products`));
      console.log(chalk.gray(`   Categories: ${Object.keys(parsedData.categorizedProducts).join(', ')}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch product data:'), error.message);
      throw error;
    }
  }

  /**
   * Step 2: Generate golden questions
   */
  async generateQuestions(regenerate = false) {
    try {
      console.log(chalk.blue('\n❓ Step 2: Generating Golden Questions'));
      console.log(chalk.gray('-'.repeat(50)));
      
      let questions;
      if (regenerate || !(questions = await this.questionGenerator.loadQuestions())) {
        questions = await this.questionGenerator.generateAllQuestions(this.results.products);
      }
      
      this.results.questions = questions;
      const totalQuestions = questions.reduce((sum, p) => sum + p.questions.length, 0);
      
      console.log(chalk.green(`✅ Generated ${totalQuestions} questions for ${questions.length} products`));
      console.log(chalk.gray(`   Questions per product: ${config.questionGeneration.questionsPerProduct}`));
      console.log(chalk.gray(`   Dimensions: ${Object.keys(config.questionGeneration.dimensions).join(', ')}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate questions:'), error.message);
      throw error;
    }
  }

  /**
   * Step 3: Run automated testing
   */
  async runAutomatedTesting(questionLimit = null, useParallel = false) {
    try {
      console.log(chalk.blue('\n🤖 Step 3: Running Automated Testing'));
      console.log(chalk.gray('-'.repeat(50)));
      
      // Smart question selection: N questions per product instead of first N total
      let questionsToTest;
      if (questionLimit) {
        // Calculate questions per product
        const questionsPerProduct = Math.max(1, Math.floor(questionLimit / this.results.questions.length));
        const remainder = questionLimit % this.results.questions.length;
        
        console.log(chalk.gray(`   Selecting ${questionsPerProduct} questions per product (${remainder} products get +1 extra)`));
        
        questionsToTest = [];
        for (let i = 0; i < this.results.questions.length; i++) {
          const productQuestions = this.results.questions[i].questions;
          // Some products get one extra question to reach the exact limit
          const questionsFromThisProduct = questionsPerProduct + (i < remainder ? 1 : 0);
          const selectedQuestions = productQuestions.slice(0, questionsFromThisProduct);
          questionsToTest.push(...selectedQuestions);
          
          if (selectedQuestions.length > 0) {
            console.log(chalk.gray(`   ${this.results.questions[i].productName}: ${selectedQuestions.length} questions`));
          }
        }
      } else {
        // No limit - test all questions
        questionsToTest = this.results.questions.flatMap(p => p.questions);
      }
      
      console.log(chalk.blue(`Testing ${questionsToTest.length} questions...`));
      
      // Initialize browser automation
      await this.tester.initialize();
      
      let allResults;
      
      // Select processing method
      if (useParallel) {
        console.log(chalk.yellow(`⚡ Parallel processing enabled for ${questionsToTest.length} questions`));
      }
      
      if (useParallel && questionsToTest.length > 3) {
        // Use parallel processing for better performance
        console.log(chalk.yellow('🚀 Using parallel processing for faster execution...'));
        allResults = await this.tester.testQuestionsParallel(questionsToTest, {
          concurrency: 3, // Process 3 questions simultaneously
          limit: questionLimit
        });
      } else {
        // Use sequential processing (original method)
        await this.tester.navigateToSite();
        
        // Run tests in batches
        const batchSize = config.execution.batchSize;
        const batches = [];
        for (let i = 0; i < questionsToTest.length; i += batchSize) {
          batches.push(questionsToTest.slice(i, i + batchSize));
        }
        
        console.log(chalk.blue(`Processing ${batches.length} batches of ${batchSize} questions each`));
        
        allResults = [];
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(chalk.blue(`\nProcessing batch ${i + 1}/${batches.length}`));
          
          const batchResults = await this.tester.testQuestions(batch);
          allResults.push(...batchResults);
          
          // Save intermediate results
          await this.tester.saveResults(allResults, `batch-${i + 1}`);
          
          // Brief pause between batches
          if (i < batches.length - 1) {
            console.log(chalk.gray('Pausing between batches...'));
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      this.results.testResults = allResults;
      
      // Cleanup browser
      await this.tester.cleanup();
      
      const successCount = allResults.filter(r => !r.error).length;
      const errorCount = allResults.filter(r => r.error).length;
      
      console.log(chalk.green(`✅ Testing completed`));
      console.log(chalk.gray(`   Successful: ${successCount}`));
      console.log(chalk.gray(`   Failed: ${errorCount}`));
      console.log(chalk.gray(`   Success rate: ${((successCount / allResults.length) * 100).toFixed(1)}%`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed during automated testing:'), error.message);
      
      // Ensure browser cleanup even on error
      try {
        await this.tester.cleanup();
      } catch (cleanupError) {
        console.error(chalk.red('Cleanup error:'), cleanupError.message);
      }
      
      throw error;
    }
  }

  /**
   * Step 4: Evaluate responses
   */
  async evaluateResponses() {
    try {
      console.log(chalk.blue('\n📊 Step 4: Evaluating Responses'));
      console.log(chalk.gray('-'.repeat(50)));
      
      const evaluatedResults = await this.evaluator.evaluateResults(this.results.testResults);
      this.results.evaluatedResults = evaluatedResults;
      
      const avgScores = this.calculateAverageScores(evaluatedResults);
      
      console.log(chalk.green('✅ Response evaluation completed'));
      console.log(chalk.gray(`   Average Relevance: ${avgScores.relevance}`));
      console.log(chalk.gray(`   Average Brand Loyalty: ${avgScores.brandLoyalty}`));
      console.log(chalk.gray(`   Average Coverage: ${avgScores.coverage}`));
      console.log(chalk.gray(`   Overall Average: ${avgScores.overall}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to evaluate responses:'), error.message);
      throw error;
    }
  }

  /**
   * Step 5: Generate analytics
   */
  async generateAnalytics() {
    try {
      console.log(chalk.blue('\n📈 Step 5: Generating Analytics'));
      console.log(chalk.gray('-'.repeat(50)));
      
      const analytics = await this.analytics.generateAnalytics(this.results.evaluatedResults);
      this.results.analytics = analytics;
      
      console.log(chalk.green('✅ Analytics generated successfully'));
      console.log(chalk.gray(`   Insights: ${analytics.insights.length}`));
      console.log(chalk.gray(`   Recommendations: ${analytics.recommendations.length}`));
      console.log(chalk.gray(`   Categories analyzed: ${Object.keys(analytics.categoryAnalysis).length}`));
      
      // Display key insights
      if (analytics.insights.length > 0) {
        console.log(chalk.blue('\n🔍 Key Insights:'));
        analytics.insights.slice(0, 3).forEach((insight, i) => {
          const icon = insight.type === 'positive' ? '✅' : '⚠️';
          console.log(chalk.gray(`   ${icon} ${insight.message}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate analytics:'), error.message);
      throw error;
    }
  }

  /**
   * Generate final comprehensive report
   */
  async generateFinalReport() {
    try {
      console.log(chalk.blue('\n📄 Generating Final Report'));
      console.log(chalk.gray('-'.repeat(50)));
      
      const reportData = {
        sessionId: this.sessionId,
        completedAt: new Date().toISOString(),
        summary: {
          totalProducts: this.results.products.length,
          totalQuestions: this.results.questions.reduce((sum, p) => sum + p.questions.length, 0),
          totalTests: this.results.testResults.length,
          successfulTests: this.results.testResults.filter(r => !r.error).length,
          averageScores: this.calculateAverageScores(this.results.evaluatedResults)
        },
        results: this.results,
        recommendations: this.results.analytics.recommendations || []
      };
      
      // Save comprehensive report
      const reportPath = path.join(config.output.reportsDir, `final-report-${this.sessionId}.json`);
      await fs.ensureDir(path.dirname(reportPath));
      await fs.writeJson(reportPath, reportData, { spaces: 2 });
      
      // Generate executive summary
      await this.generateExecutiveSummary(reportData);
      
      console.log(chalk.green(`✅ Final report generated: ${reportPath}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate final report:'), error.message);
      throw error;
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(reportData) {
    const summary = `
Adobe Brand Concierge Evaluation - Executive Summary
==================================================

Session: ${reportData.sessionId}
Completed: ${new Date(reportData.completedAt).toLocaleString()}

OVERVIEW
--------
• Total Products Evaluated: ${reportData.summary.totalProducts}
• Total Questions Generated: ${reportData.summary.totalQuestions}
• Total Tests Executed: ${reportData.summary.totalTests}
• Successful Tests: ${reportData.summary.successfulTests}
• Success Rate: ${((reportData.summary.successfulTests / reportData.summary.totalTests) * 100).toFixed(1)}%

PERFORMANCE SCORES
-----------------
• Relevance: ${reportData.summary.averageScores.relevance}/5.0
• Brand Loyalty: ${reportData.summary.averageScores.brandLoyalty}/5.0
• Coverage: ${reportData.summary.averageScores.coverage}/5.0
• Overall: ${reportData.summary.averageScores.overall}/5.0

TARGET ACHIEVEMENT
-----------------
• Relevance Target (4.0): ${reportData.summary.averageScores.relevance >= 4.0 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}
• Brand Loyalty Target (4.2): ${reportData.summary.averageScores.brandLoyalty >= 4.2 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}
• Coverage Target (3.8): ${reportData.summary.averageScores.coverage >= 3.8 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}

TOP RECOMMENDATIONS
------------------
${reportData.recommendations.slice(0, 5).map((rec, i) => 
  `${i + 1}. ${rec.title}\n   ${rec.description}`
).join('\n\n')}

For detailed analysis and insights, please refer to the full analytics report.
`;

    const summaryPath = path.join(config.output.reportsDir, `executive-summary-${reportData.sessionId}.txt`);
    await fs.writeFile(summaryPath, summary.trim());
    
    console.log(chalk.green(`📋 Executive summary: ${summaryPath}`));
  }

  /**
   * Calculate average scores from evaluated results
   */
  calculateAverageScores(evaluatedResults) {
    if (!evaluatedResults || evaluatedResults.length === 0) {
      return { relevance: 0, brandLoyalty: 0, coverage: 0, overall: 0 };
    }

    const validResults = evaluatedResults.filter(r => !r.error && r.evaluation);
    
    if (validResults.length === 0) {
      return { relevance: 0, brandLoyalty: 0, coverage: 0, overall: 0 };
    }

    const relevanceScores = validResults.map(r => r.evaluation.relevance.score);
    const brandLoyaltyScores = validResults.map(r => r.evaluation.brandLoyalty.score);
    const coverageScores = validResults.map(r => r.evaluation.coverage.score);
    const overallScores = validResults.map(r => r.evaluation.overallScore);

    return {
      relevance: Math.round((relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length) * 100) / 100,
      brandLoyalty: Math.round((brandLoyaltyScores.reduce((sum, score) => sum + score, 0) / brandLoyaltyScores.length) * 100) / 100,
      coverage: Math.round((coverageScores.reduce((sum, score) => sum + score, 0) / coverageScores.length) * 100) / 100,
      overall: Math.round((overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length) * 100) / 100
    };
  }

  /**
   * Run individual components
   */
  async fetchProductsOnly(refresh = false) {
    await this.fetchProductData(refresh);
    return this.results.products;
  }

  async generateQuestionsOnly(regenerate = false) {
    if (this.results.products.length === 0) {
      await this.fetchProductData();
    }
    await this.generateQuestions(regenerate);
    return this.results.questions;
  }

  // Removed: replaced by improved runTestingOnly method with parallel support

  async evaluateOnly() {
    if (this.results.testResults.length === 0) {
      throw new Error('No test results found. Run testing first.');
    }
    await this.evaluateResponses();
    return this.results.evaluatedResults;
  }

  async analyticsOnly() {
    if (this.results.evaluatedResults.length === 0) {
      throw new Error('No evaluated results found. Run evaluation first.');
    }
    await this.generateAnalytics();
    return this.results.analytics;
  }
}

// CLI Interface
if (require.main === module) {
  program
    .name('adobe-brand-concierge-evaluator')
    .description('Automated evaluation system for Adobe Brand Concierge')
    .version('1.0.0');

  program
    .command('run')
    .description('Run complete evaluation pipeline')
    .option('-r, --refresh-products', 'Refresh product data from GitHub')
    .option('-q, --regenerate-questions', 'Regenerate questions')
    .option('--skip-testing', 'Skip automated testing')
    .option('--skip-evaluation', 'Skip response evaluation')
    .option('--skip-analytics', 'Skip analytics generation')
    .option('-l, --limit <number>', 'Limit number of questions to test', parseInt)
    .option('-p, --parallel', 'Use parallel processing for faster execution')
    .action(async (options) => {
      const system = new UAREvaluationSystem();
      try {
        await system.runCompleteEvaluation({
          refreshProducts: options.refreshProducts,
          regenerateQuestions: options.regenerateQuestions,
          skipTesting: options.skipTesting,
          skipEvaluation: options.skipEvaluation,
          skipAnalytics: options.skipAnalytics,
          questionLimit: options.limit,
          useParallel: options.parallel
        });
      } catch (error) {
        console.error(chalk.red('Evaluation failed:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('fetch')
    .description('Fetch product data only')
    .option('-r, --refresh', 'Refresh from GitHub')
    .action(async (options) => {
      const system = new UAREvaluationSystem();
      try {
        await system.fetchProductsOnly(options.refresh);
      } catch (error) {
        console.error(chalk.red('Failed:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('questions')
    .description('Generate questions only')
    .option('-r, --regenerate', 'Regenerate questions')
    .action(async (options) => {
      const system = new UAREvaluationSystem();
      try {
        await system.generateQuestionsOnly(options.regenerate);
      } catch (error) {
        console.error(chalk.red('Failed:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('test')
    .description('Run testing only')
    .option('-l, --limit <number>', 'Limit number of questions', parseInt)
    .option('-p, --parallel', 'Use parallel processing for faster execution')
    .action(async (options) => {
      const system = new UAREvaluationSystem();
      try {
        await system.runTestingOnly(options.limit, options.parallel);
      } catch (error) {
        console.error(chalk.red('Failed:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('evaluate')
    .description('Evaluate existing test results')
    .action(async () => {
      const system = new UAREvaluationSystem();
      try {
        await system.evaluateOnly();
      } catch (error) {
        console.error(chalk.red('Failed:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('analytics')
    .description('Generate analytics from evaluated results')
    .action(async () => {
      const system = new UAREvaluationSystem();
      try {
        await system.analyticsOnly();
      } catch (error) {
        console.error(chalk.red('Failed:'), error.message);
        process.exit(1);
      }
    });

  program.parse();
}

module.exports = UAREvaluationSystem;
