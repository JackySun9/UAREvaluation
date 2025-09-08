# Adobe Brand Concierge Evaluation System

A comprehensive automated evaluation system for testing Adobe Brand Concierge using Playwright automation, golden question generation, multi-dimensional analysis, and rich visualizations.

## ✨ Key Features

- 🤖 **Automated Testing**: Playwright automation with 100% success rate across 36 Adobe products
- 📝 **Smart Question Generation**: 360 professional questions across 5 evaluation dimensions
- ⚡ **Parallel Processing**: 2-3x faster execution with concurrent browser instances
- 📊 **Multi-Dimensional Scoring**: Relevance, Brand Loyalty, and Coverage evaluation
- 📈 **Rich Visualizations**: Interactive dashboard with 6 chart types
- 🔍 **Intelligent Analysis**: Low-score detection with targeted improvement recommendations

## 📦 Quick Start

```bash
# 1. Install dependencies and setup
npm install && npx playwright install chromium

# 2. Run demo with 3 questions and visualization
npm run demo

# 3. View results and dashboard
npm run view
```

## 📊 Evaluation Framework

| Dimension | Target Score | Measures |
|-----------|-------------|----------|
| **🎯 Relevance** | ≥4.0 | Product accuracy, user intent understanding, feature matching |
| **🏢 Brand Loyalty** | ≥4.2 | Adobe promotion, advantage highlighting, competitor handling |
| **📋 Coverage** | ≥3.8 | Information completeness, cross-product recommendations, detail depth |

## 🚀 Usage

### Essential Commands
```bash
# Quick demo with visualization
npm run demo                 # 3 questions, full charts & dashboard

# Fast parallel testing (recommended)
npm run test:parallel        # 10 questions across ALL products, 3x faster

# Full evaluation
npm start                    # All 360 questions across 36 products

# View results with analysis
npm run view                 # Summary with low-scoring analysis
npm run view:detailed        # Comprehensive analysis with recommendations
```

### ⚡ Parallel vs Sequential Performance
| Mode | Command | Coverage | Speed | Use Case |
|------|---------|----------|-------|----------|
| **⚡ Parallel** | `npm run test:parallel` | 46 questions, ALL products | ~10s per question | **Recommended** - Fast & comprehensive |
| **Sequential** | `npm test` | 5 questions, 1 product | ~27s per question | Development testing |

### Advanced Options
```bash
# Custom question limits with smart distribution
node src/index.js test --limit 15 --parallel

# Data management
npm run fetch                # Update product data
npm run questions            # Regenerate questions only
npm run evaluate             # Process existing results

# Configuration
node src/index.js run --refresh-products    # Force product data refresh
node src/index.js run --skip-testing        # Skip testing phase
```

## 🔍 Analysis & Insights

### Low-Score Detection
The system automatically identifies problematic questions and provides targeted recommendations:

- **🚨 Critical Issues**: Questions scoring < 2.0 with detailed analysis
- **⚠️ Low Performance**: Questions scoring < 2.5 with examples  
- **📈 Pattern Analysis**: Issues by category, product, and question type
- **🎯 Recommendations**: Specific improvements with priority levels

```bash
# View analysis
npm run view                 # Basic analysis with examples
npm run view:detailed        # Comprehensive patterns & recommendations

# Example output
⚠️ Found 10 questions below 2.5 (28%)
📊 Worst performing: Relevance (6 questions, avg: 1.95)
💡 Key recommendation: Improve product accuracy detection
```

### Output Locations
| File | Contains |
|------|----------|
| Console Output | Formatted analysis for quick review |
| `reports/analytics-report.json` | Complete data for programmatic access |
| `reports/dashboard.html` | Visual charts and metrics |

## 📊 Generated Files

| Category | Files | Description |
|----------|-------|-------------|
| **🔄 Data** | `data/products/`, `data/questions/`, `data/results/` | Product info, generated questions, test results |
| **📈 Reports** | `reports/analytics-report.json`, `reports/executive-summary-*.txt` | Analytics, insights, and summaries |
| **📊 Charts** | `reports/charts/*.png`, `reports/dashboard.html` | 6 chart types + interactive dashboard |

## 🏗️ System Architecture

The system is built with 6 core components working together in a pipeline:

1. **📦 ProductFetcher** → Loads 36 Adobe products from GitHub
2. **❓ GoldenQuestionGenerator** → Creates 360 questions across 5 dimensions  
3. **🤖 BrandConciergeTester** → Playwright automation with parallel processing
4. **📊 ResponseEvaluator** → Scores responses across 3 dimensions
5. **📈 AnalyticsEngine** → Generates insights and recommendations
6. **📊 ChartGenerator** → Creates visualizations and dashboard

### Question Types (10 per product)
- **Product Identification**: "What tool do I need for [task]?"
- **Use Case Matching**: "Which Adobe product for [specific scenario]?"  
- **Skill Level**: "Best Adobe tool for [beginner/professional]?"
- **Budget & Pricing**: "What fits my [budget/user type]?"
- **Competitor Comparison**: "Adobe advantages over [competitor]?"

## 🎨 Visualization Dashboard

The system generates 6 chart types plus an interactive HTML dashboard:
- Overall performance vs targets
- Category breakdowns  
- Score distributions
- Target achievement radar
- Question type performance
- Response time analysis

Access via `npm run view` or open `reports/dashboard.html` directly.

## ⚙️ Configuration

Key settings in `config/config.js`:

```javascript
{
  execution: {
    concurrency: 3,           // Parallel browser instances  
    delayBetweenQuestions: 8000,  // Wait time between questions
    maxWaitForResponse: 120000,   // AI response timeout
  },
  browser: {
    headless: false,          // Set true for CI/automated runs
  }
}
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Browser not found** | `npx playwright install chromium` |
| **Network timeouts** | Increase `waitTimeout` in config, check connection |
| **Parallel processing fails** | Reduce `concurrency` to 2 or use `npm test` (sequential) |
| **Rate limiting** | Use `--limit` flag or increase `delayBetweenQuestions` |

**Debug mode**: `DEBUG=1 node src/index.js run`

## 📊 System Capabilities

- ✅ **36 Adobe Products** across 5 categories (Video, Design, PDF, Photo, 3D)
- ✅ **360 Professional Questions** with smart distribution  
- ⚡ **Parallel Processing** with 3 concurrent browsers (2-3x faster)
- 🎯 **Multi-Dimensional Scoring** across Relevance, Brand Loyalty, Coverage
- 📈 **6 Visualization Types** plus interactive dashboard
- 🔍 **Intelligent Analysis** with targeted recommendations
- 🤖 **100% Automation Success** with Playwright

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📚 Support

**Need help?**
1. Check troubleshooting table above
2. Run `npm run view:detailed` for diagnostics  
3. Review debug screenshots in `data/results/debug-screenshots/`
4. Open an issue with logs and configuration details
