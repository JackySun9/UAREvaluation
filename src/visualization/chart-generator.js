const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const config = require('../../config/config');

class ChartGenerator {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width: this.width, 
      height: this.height,
      backgroundColour: 'white'
    });
  }

  /**
   * Generate all charts from analytics data
   */
  async generateAllCharts(analytics) {
    try {
      console.log(chalk.blue('📊 Generating visualization charts...'));
      
      const chartsDir = path.join(config.output.reportsDir, 'charts');
      await fs.ensureDir(chartsDir);
      
      const charts = [];

      // 1. Overall Performance Chart
      const overallChart = await this.generateOverallPerformanceChart(analytics);
      const overallPath = path.join(chartsDir, 'overall-performance.png');
      await fs.writeFile(overallPath, overallChart);
      charts.push({ name: 'Overall Performance', path: overallPath });

      // 2. Category Performance Chart
      const categoryChart = await this.generateCategoryPerformanceChart(analytics);
      const categoryPath = path.join(chartsDir, 'category-performance.png');
      await fs.writeFile(categoryPath, categoryChart);
      charts.push({ name: 'Category Performance', path: categoryPath });

      // 3. Score Distribution Chart
      const distributionChart = await this.generateScoreDistributionChart(analytics);
      const distributionPath = path.join(chartsDir, 'score-distribution.png');
      await fs.writeFile(distributionPath, distributionChart);
      charts.push({ name: 'Score Distribution', path: distributionPath });

      // 4. Target Achievement Chart
      const targetChart = await this.generateTargetAchievementChart(analytics);
      const targetPath = path.join(chartsDir, 'target-achievement.png');
      await fs.writeFile(targetPath, targetChart);
      charts.push({ name: 'Target Achievement', path: targetPath });

      // 5. Question Type Performance Chart
      const questionTypeChart = await this.generateQuestionTypeChart(analytics);
      const questionTypePath = path.join(chartsDir, 'question-type-performance.png');
      await fs.writeFile(questionTypePath, questionTypeChart);
      charts.push({ name: 'Question Type Performance', path: questionTypePath });

      // 6. Response Time Chart
      if (analytics.performanceMetrics && analytics.performanceMetrics.responseTime) {
        const responseTimeChart = await this.generateResponseTimeChart(analytics);
        const responseTimePath = path.join(chartsDir, 'response-time.png');
        await fs.writeFile(responseTimePath, responseTimeChart);
        charts.push({ name: 'Response Time Distribution', path: responseTimePath });
      }

      console.log(chalk.green(`✅ Generated ${charts.length} visualization charts`));
      charts.forEach(chart => {
        console.log(chalk.gray(`   📊 ${chart.name}: ${chart.path}`));
      });

      return charts;

    } catch (error) {
      console.error(chalk.red('❌ Error generating charts:'), error.message);
      throw error;
    }
  }

  /**
   * Generate overall performance chart across all dimensions
   */
  async generateOverallPerformanceChart(analytics) {
    const scores = analytics.overallPerformance.averageScores;
    const targets = config.evaluation.targetScores.overall;

    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['Relevance', 'Brand Loyalty', 'Coverage', 'Overall'],
        datasets: [
          {
            label: 'Current Score',
            data: [scores.relevance, scores.brandLoyalty, scores.coverage, scores.overall],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            borderWidth: 1
          },
          {
            label: 'Target Score',
            data: [targets.relevance, targets.brandLoyalty, targets.coverage, 4.0],
            backgroundColor: 'rgba(75, 192, 192, 0.3)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            type: 'line'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Overall Performance vs Targets',
            font: { size: 18 }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 0.5
            }
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate category performance chart
   */
  async generateCategoryPerformanceChart(analytics) {
    const categories = Object.entries(analytics.categoryAnalysis || {});
    
    if (categories.length === 0) {
      return this.generateNoDataChart('No category data available');
    }

    const labels = categories.map(([name]) => name);
    const relevanceData = categories.map(([, data]) => data.averageScores.relevance);
    const brandLoyaltyData = categories.map(([, data]) => data.averageScores.brandLoyalty);
    const coverageData = categories.map(([, data]) => data.averageScores.coverage);

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Relevance',
            data: relevanceData,
            backgroundColor: '#FF6384'
          },
          {
            label: 'Brand Loyalty',
            data: brandLoyaltyData,
            backgroundColor: '#36A2EB'
          },
          {
            label: 'Coverage',
            data: coverageData,
            backgroundColor: '#FFCE56'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Performance by Product Category',
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate score distribution chart
   */
  async generateScoreDistributionChart(analytics) {
    const distribution = analytics.overallPerformance.scoreDistribution || {};
    
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Excellent (4.5-5.0)', 'Good (4.0-4.4)', 'Average (3.0-3.9)', 'Poor (2.0-2.9)', 'Very Poor (1.0-1.9)'],
        datasets: [{
          data: [
            distribution.overall?.excellent || 0,
            distribution.overall?.good || 0,
            distribution.overall?.average || 0,
            distribution.overall?.poor || 0,
            distribution.overall?.veryPoor || 0
          ],
          backgroundColor: [
            '#4CAF50',  // Green for excellent
            '#8BC34A',  // Light green for good
            '#FFC107',  // Yellow for average
            '#FF9800',  // Orange for poor
            '#F44336'   // Red for very poor
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Overall Score Distribution',
            font: { size: 18 }
          },
          legend: {
            position: 'right'
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate target achievement chart
   */
  async generateTargetAchievementChart(analytics) {
    const targets = analytics.targetAchievement?.overall || {};
    
    const dimensions = ['relevance', 'brandLoyalty', 'coverage'];
    const current = dimensions.map(dim => targets[dim]?.current || 0);
    const target = dimensions.map(dim => targets[dim]?.target || 0);
    const labels = ['Relevance', 'Brand Loyalty', 'Coverage'];

    const chartConfig = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Performance',
            data: current,
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            pointBackgroundColor: '#FF6384'
          },
          {
            label: 'Target Performance',
            data: target,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            pointBackgroundColor: '#36A2EB'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Current Performance vs Targets',
            font: { size: 18 }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate question type performance chart
   */
  async generateQuestionTypeChart(analytics) {
    const questionTypes = Object.entries(analytics.questionTypeAnalysis || {});
    
    if (questionTypes.length === 0) {
      return this.generateNoDataChart('No question type data available');
    }

    const labels = questionTypes.map(([name]) => this.formatQuestionTypeName(name));
    const overallScores = questionTypes.map(([, data]) => data.averageScores.overall);

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Average Score',
          data: overallScores,
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y', // This makes it horizontal
        plugins: {
          title: {
            display: true,
            text: 'Performance by Question Type',
            font: { size: 18 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate response time distribution chart
   */
  async generateResponseTimeChart(analytics) {
    const responseTime = analytics.performanceMetrics.responseTime;
    
    const chartConfig = {
      type: 'pie',
      data: {
        labels: ['Fast (<2s)', 'Medium (2-5s)', 'Slow (>5s)'],
        datasets: [{
          data: [
            responseTime.distribution?.fast || 0,
            responseTime.distribution?.medium || 0,
            responseTime.distribution?.slow || 0
          ],
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Response Time Distribution (Avg: ${Math.round(responseTime.average || 0)}ms)`,
            font: { size: 18 }
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate a "no data" chart
   */
  async generateNoDataChart(message) {
    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          backgroundColor: '#E0E0E0'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: message,
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1
          }
        }
      }
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Format question type names for display
   */
  formatQuestionTypeName(name) {
    return name.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  /**
   * Generate HTML dashboard with all charts
   */
  async generateHtmlDashboard(analytics, chartPaths) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adobe Brand Concierge Evaluation Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .chart { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .chart img { max-width: 100%; height: auto; }
        .chart h3 { margin-top: 0; color: #333; text-align: center; }
        .status-good { color: #4CAF50; }
        .status-warn { color: #FF9800; }
        .status-bad { color: #F44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Adobe Brand Concierge Evaluation Dashboard</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>📊 Executive Summary</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value ${this.getStatusClass(analytics.overallPerformance.averageScores.overall, 4.0)}">${analytics.overallPerformance.averageScores.overall.toFixed(2)}</div>
                <div class="metric-label">Overall Score</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getStatusClass(analytics.overallPerformance.averageScores.relevance, 4.0)}">${analytics.overallPerformance.averageScores.relevance.toFixed(2)}</div>
                <div class="metric-label">Relevance</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getStatusClass(analytics.overallPerformance.averageScores.brandLoyalty, 4.2)}">${analytics.overallPerformance.averageScores.brandLoyalty.toFixed(2)}</div>
                <div class="metric-label">Brand Loyalty</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getStatusClass(analytics.overallPerformance.averageScores.coverage, 3.8)}">${analytics.overallPerformance.averageScores.coverage.toFixed(2)}</div>
                <div class="metric-label">Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analytics.metadata.successfulTests}</div>
                <div class="metric-label">Successful Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${((analytics.metadata.successfulTests / analytics.metadata.totalResults) * 100).toFixed(1)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
    </div>

    <div class="charts">
        ${chartPaths.map(chart => `
        <div class="chart">
            <h3>📊 ${chart.name}</h3>
            <img src="${path.relative(path.dirname(path.join(config.output.reportsDir, 'dashboard.html')), chart.path)}" alt="${chart.name}">
        </div>
        `).join('')}
    </div>

    <div class="summary">
        <h2>🔍 Key Insights</h2>
        <ul>
        ${(analytics.insights || []).slice(0, 5).map(insight => 
          `<li class="${insight.type === 'positive' ? 'status-good' : 'status-warn'}">${insight.message}</li>`
        ).join('')}
        </ul>

        <h2>💡 Top Recommendations</h2>
        <ol>
        ${(analytics.recommendations || []).slice(0, 5).map(rec => 
          `<li><strong>${rec.title}</strong>: ${rec.description}</li>`
        ).join('')}
        </ol>
    </div>
</body>
</html>`;

    const dashboardPath = path.join(config.output.reportsDir, 'dashboard.html');
    await fs.writeFile(dashboardPath, htmlContent);
    
    console.log(chalk.green(`✅ HTML Dashboard generated: ${dashboardPath}`));
    return dashboardPath;
  }

  /**
   * Get CSS status class based on score and target
   */
  getStatusClass(score, target) {
    if (score >= target) return 'status-good';
    if (score >= target * 0.8) return 'status-warn';
    return 'status-bad';
  }
}

module.exports = ChartGenerator;
