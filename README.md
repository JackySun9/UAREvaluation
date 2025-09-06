# Adobe Brand Concierge Evaluation System

A comprehensive automated evaluation system for testing Adobe Brand Concierge using Playwright automation, golden question generation, multi-dimensional analysis, and rich visualizations.

## 🚀 Features

- **Automated Product Data Fetching**: Downloads and parses 36 Adobe products from GitHub
- **Golden Question Generation**: Creates complete, professional questions (360 total) across 5 evaluation dimensions
- **⚡ Parallel Processing**: Multiple browser instances for 2-3x faster execution with true concurrent testing
- **🎯 Smart Question Distribution**: Intelligently distributes questions across ALL products instead of just the first one
- **Playwright Automation**: Automated testing of the Brand Concierge interface with 100% success rate
- **Multi-Dimensional Evaluation**: Scores responses on Relevance, Brand Loyalty, and Coverage
- **Rich Visualizations**: 6 different chart types with professional graphics
- **Interactive Dashboard**: HTML dashboard with embedded charts and metrics
- **Comprehensive Analytics**: Detailed reports with insights and recommendations
- **🔍 Low-Score Analysis**: Detailed analysis of poorly performing questions with specific examples and targeted recommendations
- **Results Viewer**: Easy-to-use results viewing and analysis tools
- **CLI Interface**: Complete command-line interface with parallel processing support

## 📦 Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Install Playwright browsers:**
```bash
npx playwright install chromium
```

## 🎯 Evaluation Dimensions

The system evaluates responses across three key dimensions:

### 1. Relevance (Target: ≥4.0)
- Product recommendation accuracy
- Understanding of user intent
- Correct feature matching

### 2. Brand Loyalty (Target: ≥4.2)
- Adobe product promotion
- Advantage highlighting
- Competitor comparison handling

### 3. Coverage (Target: ≥3.8)
- Information completeness
- Cross-product recommendations
- Detailed feature explanations

## 🚀 Usage

### Quick Start
```bash
# 1. Install and setup
npm install && npm run setup

# 2. Run demo (3 questions with visualization)
npm run demo

# 3. View results and dashboard
npm run view
```

### Complete Evaluation Pipeline
```bash
# Run full evaluation (all 360 questions across 36 products)
npm start

# Run with limited questions for testing
npm test                    # 5 questions (sequential processing)
npm run test:parallel      # 10 questions (parallel processing, 2-3x faster)
npm run demo               # 3 questions with full visualization
```

### ⚡ Parallel Processing (NEW!)
```bash
# Fast parallel testing with multiple browser instances
npm run test:parallel      # 10 questions across ALL products, 3x faster

# Custom parallel testing with any number of questions
node src/index.js test --limit 15 --parallel

# Compare performance: sequential vs parallel
npm test                   # Sequential: ~27s per question
npm run test:parallel      # Parallel: ~10s per question (3 concurrent browsers)
```

### Individual Components
```bash
# Data management
npm run fetch              # Fetch product data only
npm run questions          # Generate questions only

# Testing and evaluation
npm run test:full          # Test all questions
npm run evaluate           # Evaluate existing test results
npm run analytics          # Generate analytics from evaluated results

# Results viewing
npm run view               # View results summary and open dashboard
npm run view:detailed      # View detailed analysis
```

### CLI Options
```bash
# Refresh product data from GitHub
node src/index.js run --refresh-products

# Regenerate questions
node src/index.js run --regenerate-questions

# Skip certain phases
node src/index.js run --skip-testing
node src/index.js run --skip-evaluation
node src/index.js run --skip-analytics

# Smart question distribution with parallel processing
node src/index.js run --limit 10 --parallel    # 10 questions across ALL products, parallel execution
node src/index.js test --limit 20 --parallel   # Testing only with parallel processing
```

### 🎯 Smart Question Distribution (NEW!)
Instead of taking the first N questions from the first product only, the system now intelligently distributes questions across ALL products:

```bash
# OLD BEHAVIOR: --limit 10 = 10 questions from Premiere Pro only
# NEW BEHAVIOR: --limit 10 = questions distributed across ALL 36 products

node src/index.js test --limit 10
# Result: ~46 total questions covering:
#   - Premiere Pro: 2 questions
#   - After Effects: 2 questions  
#   - Illustrator: 2 questions
#   - Photoshop: 2 questions
#   - And 32 other products: 1 question each
```

## 🔍 Low-Scoring Questions Analysis (NEW!)

The system now provides detailed analysis of poorly performing questions to help identify specific improvement areas.

### **What It Analyzes:**
- **Questions scoring < 2.5** (low performance threshold)
- **Questions scoring < 2.0** (critical issues threshold)  
- **Dimension-specific problems** (relevance, brand loyalty, coverage)
- **Category patterns** (which product types struggle most)
- **Question type issues** (which question dimensions fail most)

### **How to Access:**

```bash
# Basic low-score analysis
npm run view
# Shows: low-scoring count, worst examples, specific questions & responses

# Comprehensive analysis with patterns
npm run view:detailed  
# Shows: critical issues, patterns by category, targeted recommendations
```

### **Sample Output:**

```bash
⚠️ Low-Scoring Questions Analysis:
   🔍 Found 10 questions below 2.5 (100.0%)
   🚨 Critical issues: 3 questions below 2.0

📊 Worst Performing Areas:
   🎯 relevance: 6 low scores (avg: 1.95)
      Example: "What would you recommend for creative design work?" (Score: 1.8)
      Response: "For creative design work, Adobe offers several powerful tools..."
   
   🏢 brandLoyalty: 3 low scores (avg: 2.00)
      Example: "I'm looking for the best software for video editing..." (Score: 1.6)

💡 Targeted Improvement Recommendations:
   [High] Relevance: 6 questions have poor relevance scores
      → Improve product recommendation accuracy by enhancing knowledge base
      Impact: Critical for user satisfaction
```

### **Where Data Is Stored:**

| Location | Contains | Best For |
|----------|----------|----------|
| **Console Output** | Formatted analysis | Quick review & actionable insights |
| **`reports/analytics-report.json`** | Complete raw data | Programmatic access & deep analysis |
| **`reports/executive-summary-*.txt`** | High-level overview | Management reporting |

### **Detailed Analysis Includes:**

- **🚨 Critical Issues**: Individual questions with scores < 2.0, full responses, dimension breakdowns
- **📈 Patterns**: Problems by product category, question type, and specific products  
- **💡 Specific Examples**: Actual questions, AI responses, and detailed scoring reasons
- **🎯 Targeted Recommendations**: Priority-based improvement suggestions with impact assessment

### **JSON Structure in Analytics Report:**

```javascript
{
  "lowScoreAnalysis": {
    "summary": {
      "totalLowScoring": 10,
      "percentageLowScoring": "100.0",
      "totalCritical": 3
    },
    "byDimension": {
      "relevance": {
        "count": 6,
        "worstExamples": [
          {
            "questionId": "animate-1", 
            "question": "What would you recommend for creative design work?",
            "score": 1.8,
            "issues": ["Mentions relevant product category", "Shows 1 accuracy indicators"],
            "response": "Full AI response text..."
          }
        ]
      }
    },
    "criticalIssues": [...],  // Questions scoring < 2.0 with full details
    "patterns": {...},        // Analysis by category, product, question type
    "recommendations": [...]  // Targeted improvement suggestions
  }
}
```

This analysis helps identify exactly what's not working and provides specific, actionable guidance for improvement.

## 📊 Output Files

The system generates comprehensive output including data, reports, and visualizations:

### Data Files
- `data/products/product-data.json` - Adobe product information (36 products)
- `data/questions/golden-questions.json` - Generated test questions (360 questions)
- `data/results/test-results.json` - Raw test results with response capture
- `data/results/evaluated-results.json` - Scored evaluations across all dimensions

### Reports & Analytics
- `reports/analytics-report.json` - **Comprehensive analytics with insights and low-score analysis**
- `reports/analytics-summary.txt` - Human-readable summary
- `reports/final-report-[session].json` - Complete session report
- `reports/executive-summary-[session].txt` - Executive summary for stakeholders

### 🔍 Low-Score Analysis Data
- **Within `analytics-report.json`**: `lowScoreAnalysis` section with complete analysis
- **Console Output**: Formatted analysis via `npm run view` and `npm run view:detailed`
- **Executive Summaries**: High-level insights on performance issues

### Visualizations
- `reports/dashboard.html` - **Interactive HTML dashboard with all charts**
- `reports/charts/overall-performance.png` - Performance vs targets comparison
- `reports/charts/category-performance.png` - Performance by product category  
- `reports/charts/score-distribution.png` - Score distribution breakdown
- `reports/charts/target-achievement.png` - Radar chart of target achievement
- `reports/charts/question-type-performance.png` - Performance by question dimension
- `reports/charts/response-time.png` - Response time distribution analysis

## 🏗️ Architecture

### Core Components

1. **ProductFetcher** (`src/data-fetcher/product-fetcher.js`)
   - Fetches Adobe product data from GitHub (36 products)
   - Parses and categorizes products into 5 categories
   - Handles data normalization and caching

2. **GoldenQuestionGenerator** (`src/question-generator/golden-questions.js`)
   - Generates 360 questions across 5 dimensions
   - Uses contextual templates with realistic scenarios
   - Creates product-specific questions with proper context

3. **BrandConciergeTester** (`src/automation/brand-concierge-tester.js`)
   - **⚡ Parallel Processing**: Multiple separate browser instances for true concurrent testing
   - **Sequential Mode**: Traditional single-browser testing with page refreshes
   - Playwright automation with 100% success rate
   - Smart input handling with multiple fallback methods  
   - Advanced response capture with AI generation detection
   - Robust browser resource management and cleanup

4. **ResponseEvaluator** (`src/evaluation/response-evaluator.js`)
   - Scores responses across three dimensions with detailed reasoning
   - Uses advanced keyword analysis and pattern matching
   - Provides dimension-specific evaluation criteria

5. **AnalyticsEngine** (`src/analytics/analytics-engine.js`)
   - Generates comprehensive analytics with insights and recommendations
   - Identifies patterns across categories, products, and question types
   - Integrates with visualization system for chart generation

6. **ChartGenerator** (`src/visualization/chart-generator.js`) 🆕
   - Creates 6 different chart types using Chart.js
   - Generates high-quality PNG charts for reports
   - Creates interactive HTML dashboard with embedded visualizations
   - Supports bar charts, radar charts, pie charts, and doughnut charts

### Question Dimensions

1. **Basic Product Identification** (2 questions)
   - "I need a tool for [functionality]. Can you recommend one?"
   - "What [product type] does Adobe have for [user role]?"

2. **Use Case Matching** (2 questions)
   - "I want to [specific task]. Which Adobe product should I use?"
   - "What tool for [work type] projects in [industry]?"

3. **Skill Level Matching** (2 questions)
   - "I'm a [skill level] wanting to learn [domain]. Where to start?"
   - "Is there a [function] tool for [skill level] users?"

4. **Budget and Pricing** (2 questions)
   - "My budget is [amount]. What can I get?"
   - "Are there discounts for [user type]?"

5. **Competitor Comparison** (2 questions)
   - "What are Adobe [product] advantages over [competitor]?"
   - "Why choose Adobe instead of [alternatives]?"

## 🎯 Target Scores

### Overall Goals
- **Relevance**: ≥4.0
- **Brand Loyalty**: ≥4.2
- **Coverage**: ≥3.8

### Category-Specific Goals
- **Popular Products** (Photoshop, Premiere): All dimensions ≥4.5
- **Professional Products** (Substance 3D): Coverage ≥4.0
- **Beginner Products** (Adobe Express): Relevance ≥4.5

## 📈 Visualization Features

The system now includes comprehensive visualization capabilities:

### 📊 Chart Types Generated
1. **Overall Performance Chart** - Bar chart showing current scores vs targets
2. **Category Performance Chart** - Multi-dimensional category comparison
3. **Score Distribution Chart** - Doughnut chart showing score ranges
4. **Target Achievement Radar** - Radar chart of dimensional performance
5. **Question Type Performance** - Horizontal bar chart by question dimension
6. **Response Time Distribution** - Pie chart of response timing analysis

### 🖥️ Interactive Dashboard
- **Professional HTML Dashboard** with embedded charts
- **Color-coded Metrics** (green/yellow/red status indicators)
- **Executive Summary** with key performance indicators
- **Responsive Design** that works on all devices
- **Insights & Recommendations** automatically generated

### 📱 Viewing Results
```bash
# View results with low-scoring analysis
npm run view                 # Basic view with low-score summary & examples

# Comprehensive analysis with patterns and recommendations  
npm run view:detailed        # Full analysis including critical issues & targeted recommendations

# Manually open dashboard in browser
open reports/dashboard.html
```

#### **What You'll See:**
- **Basic View**: Overall scores, low-scoring questions count, worst examples, targeted recommendations
- **Detailed View**: Critical issues, patterns by category/question type, comprehensive recommendations
- **Dashboard**: Interactive charts and visual performance metrics

## 🔧 Configuration

Edit `config/config.js` to customize:

```javascript
module.exports = {
  brandConcierge: {
    url: 'https://www.stage.adobe.com/cc-shared/fragments/uar/brand-concierge/brand-concierge',
    waitTimeout: 30000,
    responseTimeout: 10000
  },
  browser: {
    headless: false,  // Set to true for automated runs
    viewport: { width: 1280, height: 720 }
  },
  execution: {
    delayBetweenQuestions: 8000,      // 8 seconds for AI generation time
    maxRetries: 3,
    batchSize: 5,                     // Reduced for parallel processing stability
    concurrency: 3,                   // Parallel browser instances (NEW!)
    maxWaitForResponse: 120000,       // 2 minutes for AI responses
    aiGenerationTimeout: 60000,       // AI generation detection timeout
    refreshPageBetweenQuestions: true // Page refresh strategy
  }
  // ... more configuration options
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser not found**
   ```bash
   npx playwright install chromium
   ```

2. **Network timeouts**
   - Increase `waitTimeout` in config
   - Check internet connection
   - Verify Brand Concierge URL accessibility

3. **Chat interface not found**
   - The system automatically tries multiple selectors
   - Debug screenshots saved to `data/results/debug-screenshots/`
   - Check if Brand Concierge interface has changed

4. **Rate limiting**
   - Increase `delayBetweenQuestions` in config
   - Reduce `batchSize` for slower processing
   - Use `--limit` flag for smaller test runs
   - For parallel processing: reduce `concurrency` from 3 to 2

5. **Parallel processing issues** ⚡
   - If browser instances fail to launch, reduce `concurrency` in config
   - For slower systems, use sequential mode: `npm test` instead of `npm run test:parallel`
   - Memory issues: reduce concurrent browsers or use `--limit` with smaller numbers

### Debug Mode

Enable debug mode for detailed logging:
```bash
DEBUG=1 node src/index.js run
```

## 📈 Sample System Output

### Console Output During Evaluation
```
🤖 Adobe Brand Concierge Testing Only
Session ID: evaluation-1757120967738
⚡ Parallel processing enabled

📦 Step 1: Fetching Adobe Product Data
✅ Successfully loaded 36 products
   Categories: Video Production, Creative Design, PDF Processing, Photography, 3D Creation

❓ Step 2: Generating Golden Questions  
✅ Generated 360 questions for 36 products
   Questions per product: 10
   Dimensions: basicProductIdentification, useCaseMatching, skillLevelMatching, budgetAndPricing, competitorComparison

🤖 Step 3: Running Automated Testing
   Selecting 1 questions per product (10 products get +1 extra)
   Premiere Pro: 2 questions
   After Effects: 2 questions
   Illustrator: 2 questions
   Photoshop: 2 questions
   [... and 32 other products: 1 question each]
Testing 46 questions...
⚡ Parallel processing enabled for 46 questions
🚀 Using parallel processing for faster execution...
🚀 Testing 10 questions with 3 parallel browser instances...

Processing batch 1/4 (3 questions)
[1] 🚀 Launching browser instance...
[2] 🚀 Launching browser instance...  
[3] 🚀 Launching browser instance...
[1] 🌐 Navigating to Brand Concierge...
[2] 🌐 Navigating to Brand Concierge...
[3] 🌐 Navigating to Brand Concierge...
[1] 💬 Asking: I'm looking for the best software for video editin...
[2] 💬 Asking: What video editing application from Adobe works we...
[3] 💬 Asking: I'm looking for the best software for motion graph...
[1] 🔒 Closing browser instance...
[2] 🔒 Closing browser instance...
[3] 🔒 Closing browser instance...
[1/10] ✅ Completed
[2/10] ✅ Completed
[3/10] ✅ Completed

✅ Parallel testing completed
   Successful: 10
   Failed: 0
   Success rate: 100.0%
   Results saved: data/results/test-results-parallel-1757120996309.json

🎉 Testing completed successfully!
```

### Dashboard Summary View
```
📊 Adobe Brand Concierge Evaluation Results Viewer
✅ Products loaded: 36
✅ Questions generated: 360
✅ Questions tested: 360
✅ Successful tests: 360

📈 Average Scores:
   ⚠️ relevance: 4.20/5.0 (Target: 4.0) ✅ ACHIEVED
   ⚠️ brandLoyalty: 3.90/5.0 (Target: 4.2) ❌ Gap: -0.3
   ✅ coverage: 3.70/5.0 (Target: 3.8) ❌ Gap: -0.1

⚠️ Low-Scoring Questions Analysis:
   🔍 Found 15 questions below 2.5 (4.2%)
   
📊 Worst Performing Areas:
   🎯 relevance: 8 low scores (avg: 2.1)
      Example: "What design tool works best for beginners?" (Score: 1.9)
   🏢 brandLoyalty: 12 low scores (avg: 2.3)  

💡 Targeted Recommendations:
   [High] Strengthen brand promotion in responses
   [Medium] Improve Creative Design category performance

📊 Generated Charts (6):
   📈 Overall performance: ./reports/charts/overall-performance.png
   📈 Category performance: ./reports/charts/category-performance.png  
   📈 Score distribution: ./reports/charts/score-distribution.png
   📈 Target achievement: ./reports/charts/target-achievement.png
   📈 Question type performance: ./reports/charts/question-type-performance.png
   📈 Response time: ./reports/charts/response-time.png

🖥️ Interactive Dashboard: ./reports/dashboard.html
```

### Key System Capabilities
- **✅ 36 Adobe Products** across 5 categories  
- **✅ 360 Generated Questions** with complete, professional templates
- **⚡ Parallel Processing** with multiple browser instances (2-3x faster)
- **🎯 Smart Distribution** across ALL products instead of just the first one
- **✅ 100% Automation Success Rate** with Playwright
- **🔍 Low-Score Analysis** with specific examples and targeted recommendations
- **✅ 6 Professional Charts** for data visualization
- **✅ Interactive HTML Dashboard** for stakeholder reports
- **✅ Multi-dimensional Analysis** with actionable insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔄 Quick Reference Commands

```bash
# Essential Commands
npm run demo                 # Demo with 3 questions + full visualization
npm run test:parallel        # Fast testing with 10 questions (⚡ NEW!)
npm run view                 # View results with low-score analysis + open dashboard
npm run view:detailed        # Comprehensive analysis with critical issues (🔍 NEW!)
npm start                    # Full evaluation (360 questions)
npm test                     # Test with 5 questions (sequential)
npm run clean                # Clean all results

# Parallel Processing Commands (⚡ NEW!)
npm run test:parallel        # 10 questions across ALL products, 3x faster
node src/index.js test --limit 15 --parallel  # Custom parallel testing
node src/index.js run --limit 20 --parallel   # Full pipeline with parallel

# Advanced Commands  
npm run view:detailed        # Detailed analysis breakdown
npm run questions            # Generate questions only
npm run analytics            # Generate analytics only
npm run fetch                # Update product data

# Direct CLI Access
node src/index.js run --limit 10           # Custom question limit (smart distribution)
node src/index.js run --refresh-products   # Refresh product data
node view-results.js                       # Direct results viewer
```

## 🎯 Typical Workflows

### Development/Testing Workflow
```bash
# 1. Quick validation
npm run demo

# 2. View results with low-score analysis 
npm run view                 # Basic analysis with examples
npm run view:detailed        # Full analysis with patterns & recommendations

# 3. Fast testing with parallel processing (⚡ NEW!)
npm run test:parallel

# 4. Custom testing with more questions
node src/index.js test --limit 20 --parallel

# 5. Full evaluation
npm start
```

### Production Workflow
```bash
# 1. Clean previous results
npm run clean

# 2. Run complete evaluation
npm start

# 3. View comprehensive results
npm run view:detailed
```

## ⚡ Performance Comparison

The new parallel processing provides significant performance improvements:

| Method | Command | Questions | Time | Speed | Browser Instances |
|--------|---------|-----------|------|--------|-------------------|
| **Sequential** | `npm test` | 5 questions from 1 product | ~135s | ~27s per question | 1 (reused) |
| **⚡ Parallel** | `npm run test:parallel` | 46 questions from ALL products | ~60s | ~10s per question | 3 concurrent |
| **Improvement** | - | **9x more coverage** | **2.3x faster** | **2.7x per question** | **3x concurrency** |

### Why Parallel Processing is Better:
- **🎯 Better Coverage**: Tests ALL products instead of just one
- **⚡ Faster Execution**: 2-3x speed improvement with concurrent browsers  
- **🔄 True Isolation**: Each question gets its own fresh browser instance
- **📊 More Realistic**: Simulates multiple users testing simultaneously

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review debug screenshots in `data/results/debug-screenshots/`
3. Use `npm run view:detailed` to see current results, low-score analysis, and diagnostics
4. Check console logs for detailed error messages  
5. View the interactive dashboard for visual debugging
6. Analyze low-scoring questions for specific improvement insights
7. Create an issue with system logs and configuration details
