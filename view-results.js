#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');

/**
 * Script to view and summarize evaluation results with visualizations
 */
async function viewResults() {
  console.log(chalk.blue.bold('📊 Adobe Brand Concierge Evaluation Results Viewer'));
  console.log(chalk.gray('='.repeat(60)));

  try {
    // Check for results
    const reportsDir = './reports';
    const chartsDir = './reports/charts';
    const dashboardPath = './reports/dashboard.html';

    if (!(await fs.pathExists(reportsDir))) {
      console.log(chalk.red('❌ No results found. Please run an evaluation first.'));
      console.log(chalk.yellow('Run: npm run demo'));
      return;
    }

    // Load analytics report
    const analyticsPath = path.join(reportsDir, 'analytics-report.json');
    if (await fs.pathExists(analyticsPath)) {
      const analytics = await fs.readJson(analyticsPath);
      
      console.log(chalk.green('✅ Evaluation Results Found'));
      console.log(chalk.blue('\n📈 Overall Performance Summary:'));
      console.log(chalk.cyan(`   Total Tests: ${analytics.metadata.totalResults}`));
      console.log(chalk.cyan(`   Successful Tests: ${analytics.metadata.successfulTests}`));
      console.log(chalk.cyan(`   Success Rate: ${((analytics.metadata.successfulTests / analytics.metadata.totalResults) * 100).toFixed(1)}%`));
      
      console.log(chalk.blue('\n🎯 Dimension Scores:'));
      const scores = analytics.overallPerformance.averageScores;
      const targets = { relevance: 4.0, brandLoyalty: 4.2, coverage: 3.8 };
      
      Object.entries(scores).forEach(([dimension, score]) => {
        const target = targets[dimension] || 4.0;
        const status = score >= target ? '✅' : '⚠️';
        const color = score >= target ? chalk.green : chalk.yellow;
        console.log(color(`   ${status} ${dimension}: ${score.toFixed(2)}/5.0 (Target: ${target})`));
      });

      // Show insights
      if (analytics.insights && analytics.insights.length > 0) {
        console.log(chalk.blue('\n🔍 Key Insights:'));
        analytics.insights.slice(0, 3).forEach((insight, i) => {
          const icon = insight.type === 'positive' ? '✅' : '⚠️';
          console.log(chalk.gray(`   ${icon} ${insight.message}`));
        });
      }

      // Show recommendations
      if (analytics.recommendations && analytics.recommendations.length > 0) {
        console.log(chalk.blue('\n💡 Top Recommendations:'));
        analytics.recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(chalk.yellow(`   ${i + 1}. ${rec.title}`));
          console.log(chalk.gray(`      ${rec.description}`));
        });
      }

      // Show low-scoring questions analysis
      if (analytics.lowScoreAnalysis) {
        const lowScore = analytics.lowScoreAnalysis;
        if (lowScore.summary.totalLowScoring > 0) {
          console.log(chalk.blue('\n⚠️  Low-Scoring Questions Analysis:'));
          console.log(chalk.red(`   🔍 Found ${lowScore.summary.totalLowScoring} questions below ${lowScore.summary.lowScoreThreshold} (${lowScore.summary.percentageLowScoring}%)`));
          
          if (lowScore.summary.totalCritical > 0) {
            console.log(chalk.red(`   🚨 Critical issues: ${lowScore.summary.totalCritical} questions below ${lowScore.summary.veryLowScoreThreshold}`));
          }

          // Show worst examples by dimension
          console.log(chalk.blue('\n📊 Worst Performing Areas:'));
          Object.entries(lowScore.byDimension).forEach(([dimension, data]) => {
            if (data.count > 0) {
              const emoji = dimension === 'relevance' ? '🎯' : dimension === 'brandLoyalty' ? '🏢' : '📋';
              console.log(chalk.yellow(`   ${emoji} ${dimension}: ${data.count} low scores (avg: ${data.averageScore.toFixed(2)})`));
              
              if (data.worstExamples.length > 0) {
                const worst = data.worstExamples[0];
                console.log(chalk.gray(`      Example: "${worst.question}" (Score: ${worst.score})`));
                console.log(chalk.gray(`      Response: "${worst.response}"`));
              }
            }
          });
        }
      }
    }

    // List available charts
    if (await fs.pathExists(chartsDir)) {
      const charts = await fs.readdir(chartsDir);
      const pngCharts = charts.filter(f => f.endsWith('.png'));
      
      console.log(chalk.blue(`\n📊 Generated Charts (${pngCharts.length}):`));
      pngCharts.forEach(chart => {
        const name = chart.replace('.png', '').replace(/-/g, ' ');
        const title = name.charAt(0).toUpperCase() + name.slice(1);
        console.log(chalk.gray(`   📈 ${title}: ./reports/charts/${chart}`));
      });
    }

    // Dashboard info
    if (await fs.pathExists(dashboardPath)) {
      console.log(chalk.blue('\n🖥️  Interactive Dashboard:'));
      console.log(chalk.green(`   📄 HTML Dashboard: ${dashboardPath}`));
      console.log(chalk.gray('   Open in browser to view interactive visualizations'));
      
      // Try to open dashboard
      console.log(chalk.blue('\n🌐 Opening dashboard in browser...'));
      exec(`open "${dashboardPath}"`, (error) => {
        if (error) {
          console.log(chalk.yellow('⚠️ Could not auto-open browser. Please manually open:'));
          console.log(chalk.cyan(`   file://${path.resolve(dashboardPath)}`));
        } else {
          console.log(chalk.green('✅ Dashboard opened in browser'));
        }
      });
    }

    // Show available files
    const allFiles = await fs.readdir(reportsDir);
    const reportFiles = allFiles.filter(f => f.endsWith('.json') || f.endsWith('.txt'));
    
    if (reportFiles.length > 0) {
      console.log(chalk.blue('\n📄 Available Reports:'));
      reportFiles.forEach(file => {
        const type = file.includes('analytics') ? '📊' : 
                    file.includes('executive') ? '📋' : 
                    file.includes('final') ? '📁' : '📄';
        console.log(chalk.gray(`   ${type} ${file}`));
      });
    }

    console.log(chalk.blue('\n🔧 Commands to explore further:'));
    console.log(chalk.yellow('   npm run demo                 # Run demo with 3 questions'));
    console.log(chalk.yellow('   npm test                     # Test with 5 questions'));
    console.log(chalk.yellow('   npm start                    # Full evaluation (360 questions)'));
    console.log(chalk.yellow('   node view-results.js         # View results again'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error viewing results:'), error.message);
    console.log(chalk.yellow('\n🔧 Try running an evaluation first:'));
    console.log(chalk.yellow('   npm run demo'));
  }
}

// Example of how to analyze specific metrics
async function showDetailedAnalysis() {
  console.log(chalk.blue('\n📊 Detailed Performance Analysis:'));
  
  try {
    const analyticsPath = './reports/analytics-report.json';
    if (!(await fs.pathExists(analyticsPath))) {
      console.log(chalk.red('❌ No analytics data found'));
      return;
    }

    const analytics = await fs.readJson(analyticsPath);

    // Category breakdown
    if (analytics.categoryAnalysis) {
      console.log(chalk.blue('\n📂 Category Performance:'));
      Object.entries(analytics.categoryAnalysis).forEach(([category, data]) => {
        const avgScore = data.averageScores.overall.toFixed(2);
        const status = avgScore >= 4.0 ? '✅' : avgScore >= 3.0 ? '⚠️' : '❌';
        console.log(chalk.gray(`   ${status} ${category}: ${avgScore}/5.0 (${data.totalQuestions} questions)`));
      });
    }

    // Response time analysis
    if (analytics.performanceMetrics && analytics.performanceMetrics.responseTime) {
      const rt = analytics.performanceMetrics.responseTime;
      console.log(chalk.blue('\n⏱️  Response Time Analysis:'));
      console.log(chalk.gray(`   Average: ${Math.round(rt.average || 0)}ms`));
      console.log(chalk.gray(`   Median: ${Math.round(rt.median || 0)}ms`));
      console.log(chalk.gray(`   Range: ${Math.round(rt.min || 0)}ms - ${Math.round(rt.max || 0)}ms`));
    }

    // Detailed low-scoring analysis
    if (analytics.lowScoreAnalysis) {
      const lowScore = analytics.lowScoreAnalysis;
      
      if (lowScore.criticalIssues && lowScore.criticalIssues.length > 0) {
        console.log(chalk.blue('\n🚨 Critical Issues (Detailed Analysis):'));
        lowScore.criticalIssues.slice(0, 3).forEach((issue, i) => {
          console.log(chalk.red(`\n   ${i + 1}. ${issue.expectedProduct} - Overall Score: ${issue.overallScore.toFixed(2)}`));
          console.log(chalk.yellow(`      Question: "${issue.question.substring(0, 100)}..."`));
          console.log(chalk.gray(`      Scores: Relevance ${issue.scores.relevance}, Brand Loyalty ${issue.scores.brandLoyalty}, Coverage ${issue.scores.coverage}`));
          console.log(chalk.gray(`      Response: "${issue.response.substring(0, 150)}..."`));
        });
      }

      // Show patterns
      if (lowScore.patterns) {
        console.log(chalk.blue('\n📈 Low-Score Patterns:'));
        
        if (lowScore.patterns.byCategory && Object.keys(lowScore.patterns.byCategory).length > 0) {
          console.log(chalk.yellow('   📂 Problematic Categories:'));
          Object.entries(lowScore.patterns.byCategory)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .forEach(([category, data]) => {
              console.log(chalk.gray(`      ${category}: ${data.count} issues (avg: ${data.averageScore.toFixed(2)})`));
            });
        }

        if (lowScore.patterns.byDimension && Object.keys(lowScore.patterns.byDimension).length > 0) {
          console.log(chalk.yellow('   📊 Question Type Issues:'));
          Object.entries(lowScore.patterns.byDimension)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([dimension, data]) => {
              console.log(chalk.gray(`      ${dimension}: ${data.count} issues (avg: ${data.averageScore.toFixed(2)})`));
            });
        }
      }

      // Show specific recommendations for low scores
      if (lowScore.recommendations && lowScore.recommendations.length > 0) {
        console.log(chalk.blue('\n💡 Targeted Improvement Recommendations:'));
        lowScore.recommendations.forEach((rec, i) => {
          const priorityColor = rec.priority === 'High' ? chalk.red : rec.priority === 'Medium' ? chalk.yellow : chalk.green;
          console.log(priorityColor(`   [${rec.priority}] ${rec.category}: ${rec.issue}`));
          console.log(chalk.gray(`      → ${rec.recommendation}`));
          console.log(chalk.gray(`      Impact: ${rec.impact}`));
        });
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error in detailed analysis:'), error.message);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--detailed') || args.includes('-d')) {
    viewResults().then(() => showDetailedAnalysis());
  } else {
    viewResults();
  }
}

module.exports = { viewResults, showDetailedAnalysis };
