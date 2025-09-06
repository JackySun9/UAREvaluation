#!/usr/bin/env node

const chalk = require('chalk');
const UAREvaluationSystem = require('./src/index');

/**
 * Demo script showing the Adobe Brand Concierge Evaluation System capabilities
 */
async function runDemo() {
  console.log(chalk.blue.bold('🎯 Adobe Brand Concierge Evaluation System - DEMO'));
  console.log(chalk.gray('='.repeat(60)));
  console.log(chalk.yellow('This demo will:'));
  console.log(chalk.yellow('1. Fetch Adobe product data'));
  console.log(chalk.yellow('2. Generate sample questions'));
  console.log(chalk.yellow('3. Test 3 questions on Brand Concierge'));
  console.log(chalk.yellow('4. Evaluate responses'));
  console.log(chalk.yellow('5. Generate analytics report'));
  console.log(chalk.gray('-'.repeat(60)));

  const system = new UAREvaluationSystem();

  try {
    // Demo with limited questions
    const demoOptions = {
      refreshProducts: false,
      regenerateQuestions: false,
      skipTesting: false,
      skipEvaluation: false,
      skipAnalytics: false,
      questionLimit: 3  // Only test 3 questions for demo
    };

    console.log(chalk.green('🚀 Starting demo evaluation...'));
    console.log(chalk.gray('Note: Browser will open to test the Brand Concierge interface\n'));

    const results = await system.runCompleteEvaluation(demoOptions);

    // Display demo results
    console.log(chalk.blue.bold('\n📊 DEMO RESULTS SUMMARY'));
    console.log(chalk.gray('='.repeat(50)));
    
    const summary = {
      totalProducts: results.products.length,
      totalQuestions: results.questions.reduce((sum, p) => sum + p.questions.length, 0),
      testedQuestions: results.testResults.length,
      successfulTests: results.testResults.filter(r => !r.error).length
    };

    console.log(chalk.green(`✅ Products loaded: ${summary.totalProducts}`));
    console.log(chalk.green(`✅ Questions generated: ${summary.totalQuestions}`));
    console.log(chalk.green(`✅ Questions tested: ${summary.testedQuestions}`));
    console.log(chalk.green(`✅ Successful tests: ${summary.successfulTests}`));

    if (results.evaluatedResults && results.evaluatedResults.length > 0) {
      const avgScores = system.calculateAverageScores(results.evaluatedResults);
      
      console.log(chalk.blue('\n📈 Average Scores:'));
      console.log(chalk.cyan(`   Relevance: ${avgScores.relevance}/5.0`));
      console.log(chalk.cyan(`   Brand Loyalty: ${avgScores.brandLoyalty}/5.0`));
      console.log(chalk.cyan(`   Coverage: ${avgScores.coverage}/5.0`));
      console.log(chalk.cyan(`   Overall: ${avgScores.overall}/5.0`));

      // Show sample questions and responses
      console.log(chalk.blue('\n❓ Sample Test Results:'));
      const sampleResults = results.evaluatedResults.slice(0, 3);
      
      sampleResults.forEach((result, index) => {
        console.log(chalk.yellow(`\n${index + 1}. Question: "${result.question.substring(0, 80)}..."`));
        console.log(chalk.gray(`   Expected Product: ${result.expectedProduct}`));
        console.log(chalk.gray(`   Category: ${result.productCategory}`));
        console.log(chalk.gray(`   Dimension: ${result.dimension}`));
        
        if (result.response && result.response.text) {
          console.log(chalk.gray(`   Response: "${result.response.text.substring(0, 100)}..."`));
        }
        
        if (result.evaluation) {
          console.log(chalk.green(`   Scores: R:${result.evaluation.relevance.score} BL:${result.evaluation.brandLoyalty.score} C:${result.evaluation.coverage.score} Overall:${result.evaluation.overallScore}`));
        }
      });
    }

    if (results.analytics && results.analytics.insights) {
      console.log(chalk.blue('\n🔍 Key Insights:'));
      results.analytics.insights.slice(0, 3).forEach((insight, i) => {
        const icon = insight.type === 'positive' ? '✅' : '⚠️';
        console.log(chalk.gray(`   ${icon} ${insight.message}`));
      });
    }

    if (results.analytics && results.analytics.recommendations) {
      console.log(chalk.blue('\n💡 Top Recommendations:'));
      results.analytics.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(chalk.yellow(`   ${i + 1}. ${rec.title}`));
        console.log(chalk.gray(`      ${rec.description}`));
      });
    }

    console.log(chalk.green.bold('\n🎉 Demo completed successfully!'));
    console.log(chalk.gray('Check the reports/ directory for detailed analysis.'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Demo failed:'), error.message);
    console.error(chalk.red('Stack trace:'), error.stack);
    
    console.log(chalk.yellow('\n🔧 Troubleshooting tips:'));
    console.log(chalk.yellow('1. Ensure you have internet connection'));
    console.log(chalk.yellow('2. Check that the Brand Concierge URL is accessible'));
    console.log(chalk.yellow('3. Try running with --headless false to see browser actions'));
    console.log(chalk.yellow('4. Check debug screenshots in data/results/debug-screenshots/'));
    
    process.exit(1);
  }
}

/**
 * Run individual component demos
 */
async function runComponentDemo(component) {
  const system = new UAREvaluationSystem();
  
  try {
    switch (component) {
      case 'fetch':
        console.log(chalk.blue('🔄 Demo: Fetching product data...'));
        const products = await system.fetchProductsOnly(true);
        console.log(chalk.green(`✅ Fetched ${products.length} products`));
        console.log(chalk.gray('Sample products:'));
        products.slice(0, 3).forEach(p => {
          console.log(chalk.gray(`   - ${p.name} (${p.category})`));
        });
        break;
        
      case 'questions':
        console.log(chalk.blue('❓ Demo: Generating questions...'));
        const questions = await system.generateQuestionsOnly(true);
        console.log(chalk.green(`✅ Generated questions for ${questions.length} products`));
        console.log(chalk.gray('Sample questions:'));
        questions.slice(0, 2).forEach(productQuestions => {
          console.log(chalk.gray(`   ${productQuestions.productName}:`));
          productQuestions.questions.slice(0, 2).forEach(q => {
            console.log(chalk.gray(`     - ${q.text.substring(0, 60)}...`));
          });
        });
        break;
        
      default:
        console.log(chalk.red('❌ Unknown component. Use: fetch, questions'));
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ Component demo failed:'), error.message);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run full demo
    runDemo().catch(error => {
      console.error(chalk.red('Demo failed:'), error.message);
      process.exit(1);
    });
  } else {
    // Run component demo
    const component = args[0];
    runComponentDemo(component).catch(error => {
      console.error(chalk.red('Component demo failed:'), error.message);
      process.exit(1);
    });
  }
}

module.exports = { runDemo, runComponentDemo };
