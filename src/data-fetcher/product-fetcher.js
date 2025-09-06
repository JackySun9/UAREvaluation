const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('../../config/config');

class ProductFetcher {
  constructor() {
    this.githubUrl = config.productData.githubUrl;
    this.localPath = config.productData.localPath;
  }

  /**
   * Fetch product data from GitHub repository
   */
  async fetchProductData() {
    try {
      console.log(chalk.blue('🔄 Fetching Adobe product data from GitHub...'));
      
      const response = await axios.get(this.githubUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Adobe-Brand-Concierge-Evaluator/1.0.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      // Ensure directory exists
      await fs.ensureDir(path.dirname(this.localPath));
      
      // Save raw data
      await fs.writeJson(this.localPath, response.data, { spaces: 2 });
      
      console.log(chalk.green('✅ Product data fetched and saved successfully'));
      console.log(chalk.gray(`   Saved to: ${this.localPath}`));
      
      return response.data;
    } catch (error) {
      console.error(chalk.red('❌ Error fetching product data:'), error.message);
      throw error;
    }
  }

  /**
   * Load product data from local file
   */
  async loadProductData() {
    try {
      if (await fs.pathExists(this.localPath)) {
        console.log(chalk.blue('📂 Loading product data from local file...'));
        const data = await fs.readJson(this.localPath);
        console.log(chalk.green('✅ Product data loaded from local file'));
        return data;
      } else {
        console.log(chalk.yellow('⚠️  Local product data not found, fetching from GitHub...'));
        return await this.fetchProductData();
      }
    } catch (error) {
      console.error(chalk.red('❌ Error loading product data:'), error.message);
      throw error;
    }
  }

  /**
   * Parse and organize product data for testing
   */
  parseProductData(rawData) {
    try {
      console.log(chalk.blue('🔄 Parsing product data...'));
      
      const products = [];
      
      // Check if data is in expected format
      if (!rawData || !Array.isArray(rawData)) {
        // If it's an object with product data, extract it
        if (rawData && typeof rawData === 'object') {
          const productKeys = Object.keys(rawData);
          for (const key of productKeys) {
            const product = rawData[key];
            if (product && typeof product === 'object') {
              products.push(this.normalizeProduct(product, key));
            }
          }
        } else {
          throw new Error('Invalid product data format');
        }
      } else {
        // If it's already an array, process each product
        rawData.forEach((product, index) => {
          products.push(this.normalizeProduct(product, index.toString()));
        });
      }

      console.log(chalk.green(`✅ Parsed ${products.length} products successfully`));
      
      // Group products by category
      const categorizedProducts = this.categorizeProducts(products);
      
      return {
        products,
        categorizedProducts,
        totalCount: products.length
      };
    } catch (error) {
      console.error(chalk.red('❌ Error parsing product data:'), error.message);
      throw error;
    }
  }

  /**
   * Normalize product data structure
   */
  normalizeProduct(product, id) {
    return {
      id: product.id || id,
      name: product.name || product.title || 'Unknown Product',
      description: product.description || product.desc || '',
      category: this.determineCategory(product),
      targetUsers: product.targetUsers || product.audience || [],
      pricing: product.pricing || product.price || {},
      features: product.features || [],
      platforms: product.platforms || product.platform || [],
      learnMoreUrl: product.learnMoreUrl || product.url || '',
      freeTrialUrl: product.freeTrialUrl || '',
      buyUrl: product.buyUrl || '',
      tags: product.tags || [],
      skillLevel: product.skillLevel || 'all',
      useCase: product.useCase || product.useCases || []
    };
  }

  /**
   * Determine product category based on name and features
   */
  determineCategory(product) {
    const name = (product.name || product.title || '').toLowerCase();
    const description = (product.description || product.desc || '').toLowerCase();
    const combined = `${name} ${description}`;

    // Define category mappings
    const categoryMap = {
      'Creative Design': ['photoshop', 'illustrator', 'indesign', 'graphic', 'design'],
      'Video Production': ['premiere', 'after effects', 'animate', 'video', 'motion'],
      'Audio Processing': ['audition', 'audio', 'sound'],
      'PDF Processing': ['acrobat', 'pdf', 'document'],
      'Photography': ['lightroom', 'photography', 'photo'],
      '3D Creation': ['substance', '3d', 'dimension', 'stager', 'painter', 'sampler'],
      'Quick Design': ['express', 'spark', 'quick'],
      'Bundle Plans': ['creative cloud', 'all apps', 'bundle', 'suite'],
      'Web Development': ['dreamweaver', 'web', 'html', 'css'],
      'Experience Design': ['xd', 'experience', 'ux', 'ui']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Categorize products into groups
   */
  categorizeProducts(products) {
    const categorized = {};
    
    products.forEach(product => {
      const category = product.category;
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(product);
    });

    // Log category distribution
    console.log(chalk.blue('📊 Product distribution by category:'));
    Object.entries(categorized).forEach(([category, prods]) => {
      console.log(chalk.gray(`   ${category}: ${prods.length} products`));
    });

    return categorized;
  }

  /**
   * Get fresh product data (force fetch from GitHub)
   */
  async refreshProductData() {
    try {
      // Remove local file to force fresh fetch
      if (await fs.pathExists(this.localPath)) {
        await fs.remove(this.localPath);
        console.log(chalk.yellow('🗑️  Removed local cache'));
      }
      
      return await this.fetchProductData();
    } catch (error) {
      console.error(chalk.red('❌ Error refreshing product data:'), error.message);
      throw error;
    }
  }
}

module.exports = ProductFetcher;
