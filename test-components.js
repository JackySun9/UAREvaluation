#!/usr/bin/env node

const chalk = require('chalk');
const ProductFetcher = require('./src/data-fetcher/product-fetcher');
const GoldenQuestionGenerator = require('./src/question-generator/golden-questions');
const ResponseEvaluator = require('./src/evaluation/response-evaluator');

/**
 * Test script to verify core components work correctly
 */
async function testComponents() {
  console.log(chalk.blue.bold('🧪 Testing Adobe Brand Concierge Evaluation System Components'));
  console.log(chalk.gray('='.repeat(70)));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Product Fetcher
  console.log(chalk.blue('\n1️⃣  Testing ProductFetcher...'));
  totalTests++;
  
  try {
    const productFetcher = new ProductFetcher();
    const productData = await productFetcher.loadProductData();
    const parsedData = productFetcher.parseProductData(productData);
    
    if (parsedData.products.length > 0) {
      console.log(chalk.green(`   ✅ Successfully loaded ${parsedData.products.length} products`));
      console.log(chalk.gray(`   Categories: ${Object.keys(parsedData.categorizedProducts).join(', ')}`));
      passedTests++;
    } else {
      throw new Error('No products loaded');
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ ProductFetcher test failed: ${error.message}`));
  }

  // Test 2: Question Generator
  console.log(chalk.blue('\n2️⃣  Testing GoldenQuestionGenerator...'));
  totalTests++;
  
  try {
    const productFetcher = new ProductFetcher();
    const productData = await productFetcher.loadProductData();
    const parsedData = productFetcher.parseProductData(productData);
    
    const questionGenerator = new GoldenQuestionGenerator();
    const sampleProducts = parsedData.products.slice(0, 2); // Test with 2 products
    const questions = await questionGenerator.generateAllQuestions(sampleProducts);
    
    if (questions.length > 0 && questions[0].questions.length === 10) {
      console.log(chalk.green(`   ✅ Generated ${questions.reduce((sum, p) => sum + p.questions.length, 0)} questions for ${questions.length} products`));
      console.log(chalk.gray(`   Sample question: "${questions[0].questions[0].text.substring(0, 60)}..."`));
      passedTests++;
    } else {
      throw new Error('Invalid question generation');
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ GoldenQuestionGenerator test failed: ${error.message}`));
  }

  // Test 3: Response Evaluator
  console.log(chalk.blue('\n3️⃣  Testing ResponseEvaluator...'));
  totalTests++;
  
  try {
    const evaluator = new ResponseEvaluator();
    
    // Create mock test result
    const mockTestResult = {
      questionId: 'test-1',
      question: 'I need professional image editing software. Can you recommend one?',
      expectedProduct: 'Adobe Photoshop',
      productCategory: 'Creative Design',
      dimension: 'basicProductIdentification',
      response: {
        text: 'Adobe Photoshop is the industry-standard professional image editing software. It offers comprehensive tools for photo retouching, digital art creation, and graphic design. Photoshop is perfect for photographers, designers, and creative professionals who need advanced editing capabilities.',
        capturedAt: new Date().toISOString(),
        method: 'test'
      },
      responseTime: 2500,
      timestamp: new Date().toISOString(),
      metadata: {}
    };
    
    const evaluation = evaluator.evaluateResponse(mockTestResult);
    
    if (evaluation.relevance && evaluation.brandLoyalty && evaluation.coverage && evaluation.overallScore) {
      console.log(chalk.green(`   ✅ Evaluation completed successfully`));
      console.log(chalk.gray(`   Scores: R:${evaluation.relevance.score} BL:${evaluation.brandLoyalty.score} C:${evaluation.coverage.score} Overall:${evaluation.overallScore}`));
      console.log(chalk.gray(`   Sample reason: "${evaluation.relevance.reasons[0] || 'No reasons available'}"`));
      passedTests++;
    } else {
      throw new Error('Invalid evaluation result');
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ ResponseEvaluator test failed: ${error.message}`));
  }

  // Test 4: Configuration
  console.log(chalk.blue('\n4️⃣  Testing Configuration...'));
  totalTests++;
  
  try {
    const config = require('./config/config');
    
    if (config.brandConcierge && config.productData && config.evaluation) {
      console.log(chalk.green(`   ✅ Configuration loaded successfully`));
      console.log(chalk.gray(`   Brand Concierge URL: ${config.brandConcierge.url.substring(0, 50)}...`));
      console.log(chalk.gray(`   Target scores: R:${config.evaluation.targetScores.overall.relevance} BL:${config.evaluation.targetScores.overall.brandLoyalty} C:${config.evaluation.targetScores.overall.coverage}`));
      passedTests++;
    } else {
      throw new Error('Invalid configuration');
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ Configuration test failed: ${error.message}`));
  }

  // Test 5: File System Structure
  console.log(chalk.blue('\n5️⃣  Testing File System Structure...'));
  totalTests++;
  
  try {
    const fs = require('fs-extra');
    const requiredDirs = [
      'data/products',
      'data/questions', 
      'data/results',
      'reports',
      'src/data-fetcher',
      'src/question-generator',
      'src/automation',
      'src/evaluation',
      'src/analytics'
    ];
    
    let allDirsExist = true;
    for (const dir of requiredDirs) {
      if (!(await fs.pathExists(dir))) {
        console.log(chalk.red(`   ❌ Missing directory: ${dir}`));
        allDirsExist = false;
      }
    }
    
    if (allDirsExist) {
      console.log(chalk.green(`   ✅ All required directories exist`));
      passedTests++;
    } else {
      throw new Error('Missing required directories');
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ File system test failed: ${error.message}`));
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 TEST SUMMARY'));
  console.log(chalk.gray('='.repeat(30)));
  console.log(chalk.green(`Passed: ${passedTests}/${totalTests}`));
  
  if (passedTests === totalTests) {
    console.log(chalk.green.bold('🎉 All tests passed! System is ready to use.'));
    console.log(chalk.blue('\n🚀 Next steps:'));
    console.log(chalk.yellow('1. Run a demo: npm run demo'));
    console.log(chalk.yellow('2. Test with limited questions: npm test'));
    console.log(chalk.yellow('3. Run full evaluation: npm start'));
  } else {
    console.log(chalk.red.bold(`❌ ${totalTests - passedTests} test(s) failed. Please fix the issues before proceeding.`));
    process.exit(1);
  }
}

// Component-specific tests
async function testProductFetcher() {
  console.log(chalk.blue('🧪 Testing ProductFetcher in detail...'));
  
  const productFetcher = new ProductFetcher();
  
  try {
    console.log(chalk.blue('Fetching product data...'));
    const rawData = await productFetcher.loadProductData();
    console.log(chalk.green(`✅ Raw data fetched: ${JSON.stringify(rawData).length} characters`));
    
    console.log(chalk.blue('Parsing product data...'));
    const parsedData = productFetcher.parseProductData(rawData);
    console.log(chalk.green(`✅ Parsed ${parsedData.products.length} products into ${Object.keys(parsedData.categorizedProducts).length} categories`));
    
    console.log(chalk.blue('Sample products:'));
    parsedData.products.slice(0, 5).forEach(product => {
      console.log(chalk.gray(`   - ${product.name} (${product.category})`));
    });
    
  } catch (error) {
    console.error(chalk.red('❌ ProductFetcher detailed test failed:'), error.message);
    throw error;
  }
}

async function testQuestionGenerator() {
  console.log(chalk.blue('🧪 Testing GoldenQuestionGenerator in detail...'));
  
  const productFetcher = new ProductFetcher();
  const questionGenerator = new GoldenQuestionGenerator();
  
  try {
    const productData = await productFetcher.loadProductData();
    const parsedData = productFetcher.parseProductData(productData);
    
    console.log(chalk.blue('Generating questions for first product...'));
    const sampleProduct = parsedData.products[0];
    const questions = questionGenerator.generateProductQuestions(sampleProduct);
    
    console.log(chalk.green(`✅ Generated ${questions.length} questions for ${sampleProduct.name}`));
    
    console.log(chalk.blue('Sample questions by dimension:'));
    const dimensionGroups = {};
    questions.forEach(q => {
      if (!dimensionGroups[q.dimension]) dimensionGroups[q.dimension] = [];
      dimensionGroups[q.dimension].push(q);
    });
    
    Object.entries(dimensionGroups).forEach(([dimension, qs]) => {
      console.log(chalk.yellow(`   ${dimension}:`));
      qs.slice(0, 1).forEach(q => {
        console.log(chalk.gray(`     - ${q.text}`));
      });
    });
    
  } catch (error) {
    console.error(chalk.red('❌ GoldenQuestionGenerator detailed test failed:'), error.message);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    testComponents().catch(error => {
      console.error(chalk.red('Component testing failed:'), error.message);
      process.exit(1);
    });
  } else {
    const testType = args[0];
    
    switch (testType) {
      case 'product-fetcher':
        testProductFetcher().catch(error => {
          console.error(chalk.red('ProductFetcher test failed:'), error.message);
          process.exit(1);
        });
        break;
      case 'question-generator':
        testQuestionGenerator().catch(error => {
          console.error(chalk.red('QuestionGenerator test failed:'), error.message);
          process.exit(1);
        });
        break;
      default:
        console.log(chalk.red('Unknown test type. Use: product-fetcher, question-generator'));
        break;
    }
  }
}

module.exports = { testComponents, testProductFetcher, testQuestionGenerator };
