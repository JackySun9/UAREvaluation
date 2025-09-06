module.exports = {
  // Adobe Brand Concierge Configuration
  brandConcierge: {
    url: 'https://www.stage.adobe.com/cc-shared/fragments/uar/brand-concierge/brand-concierge',
    testUrl: 'https://www.stage.adobe.com/cc-shared/fragments/uar/brand-concierge/brand-concierge',
    waitTimeout: 30000,
    responseTimeout: 10000
  },

  // Adobe Product Data Source
  productData: {
    githubUrl: 'https://raw.githubusercontent.com/adobecom/milo/bc-uar/libs/blocks/bc-uar-metadata/product-data.json',
    localPath: './data/products/product-data.json'
  },

  // Question Generation Settings
  questionGeneration: {
    questionsPerProduct: 10,
    dimensions: {
      basicProductIdentification: 2,
      useCaseMatching: 2,
      skillLevelMatching: 2,
      budgetAndPricing: 2,
      competitorComparison: 2
    }
  },

  // Evaluation Scoring
  evaluation: {
    dimensions: ['relevance', 'brandLoyalty', 'coverage'],
    scoreRange: [1, 5],
    targetScores: {
      overall: {
        relevance: 4.0,
        brandLoyalty: 4.2,
        coverage: 3.8
      },
      popularProducts: {
        relevance: 4.5,
        brandLoyalty: 4.5,
        coverage: 4.5
      },
      professionalProducts: {
        coverage: 4.0
      },
      beginnerProducts: {
        relevance: 4.5
      }
    }
  },

  // Output Settings
  output: {
    resultsDir: './data/results',
    reportsDir: './reports',
    questionsDir: './data/questions',
    logLevel: 'info'
  },

  // Browser Settings for Playwright
  browser: {
    headless: false, // Set to true for production
    viewport: {
      width: 1280,
      height: 720
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },

  // Test Execution Settings
  execution: {
    delayBetweenQuestions: 8000, // 8 seconds - increased for AI generation time
    maxRetries: 3,
    concurrency: 1, // Process one question at a time to avoid rate limiting
    batchSize: 5, // Reduced batch size for better stability with AI responses
    refreshPageBetweenQuestions: true, // Refresh page between questions to avoid input field issues
    maxWaitForResponse: 120000, // 2 minutes max wait for AI response generation
    aiGenerationTimeout: 60000 // 1 minute specifically for AI generation detection
  }
};
