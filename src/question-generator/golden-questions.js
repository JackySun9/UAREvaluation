const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('../../config/config');

class GoldenQuestionGenerator {
  constructor() {
    this.dimensions = config.questionGeneration.dimensions;
    this.questionsPerProduct = config.questionGeneration.questionsPerProduct;
    
    // Question templates for each dimension
    this.questionTemplates = {
      basicProductIdentification: [
        {
          template: "I need a professional tool for {functionality}. Can you recommend one?",
          variants: ["Can you suggest a professional tool for {functionality}?", "What would you recommend for {functionality} work?", "I'm looking for the best software for {functionality}. Any suggestions?"]
        },
        {
          template: "What {productType} software does Adobe have that is suitable for {targetUser}?",
          variants: ["What Adobe {productType} tool would you recommend for {targetUser}?", "Which Adobe {productType} solution is best for {targetUser}?", "What {productType} application from Adobe works well for {targetUser}?"]
        }
      ],
      useCaseMatching: [
        {
          template: "I want to {specificTask}. What Adobe product should I use?",
          variants: ["Which Adobe tool should I use for {specificTask}?", "What's the best Adobe product for {specificTask}?", "I need to {specificTask}, which Adobe software would work best?"]
        },
        {
          template: "What tool do you recommend for {workType} projects in the {industry} field?",
          variants: ["What's the best solution for {workType} projects in {industry}?", "Which Adobe product is ideal for {workType} in the {industry} industry?", "What would you suggest for professional {workType} work in {industry}?"]
        }
      ],
      skillLevelMatching: [
        {
          template: "I'm a {skillLevel} in {domain} and want to learn {productFunction}. Which software should I start with?",
          variants: ["Where should I begin as a {skillLevel} learning {productFunction}?", "What's the best starting point for {skillLevel} users in {productFunction}?", "I'm new to {domain}, which tool should I use for {productFunction}?"]
        },
        {
          template: "Is there a {productFunction} tool suitable for {skillLevel} users?",
          variants: ["Do you have a {productFunction} solution for {skillLevel} users?", "What {productFunction} tool works well for {skillLevel} professionals?", "Is there an Adobe {productFunction} product designed for {skillLevel} users?"]
        }
      ],
      budgetAndPricing: [
        {
          template: "My budget is {budget} per month. Can I get {productName} with that?",
          variants: ["Is {productName} available for {budget} per month?", "Can I afford {productName} with a {budget} monthly budget?", "What can I get for {budget} per month from Adobe?"]
        },
        {
          template: "Are there any discount plans for {userType} to purchase {productName}? What is the most cost-effective plan?",
          variants: ["What student discounts are available for {productName}?", "Are there educational pricing options for {productName}?", "What's the cheapest way to get {productName} for {userType}?"]
        }
      ],
      competitorComparison: [
        {
          template: "What are the advantages of Adobe {productName} over {competitor}?",
          variants: ["Why should I choose Adobe {productName} instead of {competitor}?", "How does Adobe {productName} compare to {competitor}?", "What makes Adobe {productName} better than {competitor}?"]
        },
        {
          template: "Why choose Adobe instead of other brands for {productType}?",
          variants: ["Why should I go with Adobe for {productType} work?", "What makes Adobe the better choice for {productType} projects?", "Why is Adobe preferred for professional {productType}?"]
        }
      ]
    };

    // Context data for generating realistic questions
    this.contextData = {
      budgets: ['$10', '$15', '$20', '$25', '$30', '$50', '$75', '$100'],
      userTypes: ['students', 'educators', 'small businesses', 'freelancers', 'teams', 'enterprises'],
      skillLevels: ['beginner', 'novice', 'intermediate', 'advanced', 'professional', 'expert'],
      industries: ['marketing', 'advertising', 'publishing', 'education', 'entertainment', 'gaming', 'architecture', 'fashion', 'e-commerce'],
      competitors: {
        'image editing': ['GIMP', 'Canva', 'Figma', 'Sketch'],
        'video editing': ['Final Cut Pro', 'DaVinci Resolve', 'Filmora', 'iMovie'],
        '3d modeling': ['Blender', 'Maya', 'Cinema 4D', '3ds Max'],
        'pdf editing': ['PDFpen', 'Foxit', 'Nitro PDF', 'Apple Preview'],
        'design tools': ['Canva', 'Figma', 'Sketch', 'InVision']
      }
    };
  }

  /**
   * Generate golden questions for all products
   */
  async generateAllQuestions(products) {
    try {
      console.log(chalk.blue(`🔄 Generating golden questions for ${products.length} products...`));
      
      const allQuestions = [];
      
      for (const product of products) {
        const productQuestions = this.generateProductQuestions(product);
        allQuestions.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          questions: productQuestions,
          generatedAt: new Date().toISOString()
        });
      }

      // Save questions to file
      const outputPath = path.join(config.output.questionsDir, 'golden-questions.json');
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeJson(outputPath, {
        metadata: {
          totalProducts: products.length,
          questionsPerProduct: this.questionsPerProduct,
          totalQuestions: allQuestions.reduce((sum, p) => sum + p.questions.length, 0),
          generatedAt: new Date().toISOString(),
          dimensions: Object.keys(this.dimensions)
        },
        questions: allQuestions
      }, { spaces: 2 });

      console.log(chalk.green(`✅ Generated ${allQuestions.reduce((sum, p) => sum + p.questions.length, 0)} questions for ${products.length} products`));
      console.log(chalk.gray(`   Saved to: ${outputPath}`));
      
      return allQuestions;
    } catch (error) {
      console.error(chalk.red('❌ Error generating questions:'), error.message);
      throw error;
    }
  }

  /**
   * Generate questions for a specific product
   */
  generateProductQuestions(product) {
    const questions = [];
    let questionId = 1;

    // Generate questions for each dimension
    for (const [dimensionName, count] of Object.entries(this.dimensions)) {
      const templates = this.questionTemplates[dimensionName];
      
      for (let i = 0; i < count; i++) {
        const template = templates[i] || templates[0]; // Use first template as fallback
        const question = this.generateQuestion(product, dimensionName, template, questionId);
        questions.push(question);
        questionId++;
      }
    }

    return questions;
  }

  /**
   * Generate a single question based on template and product data
   */
  generateQuestion(product, dimension, template, questionId) {
    // Create product-specific context
    const context = this.createProductContext(product);
    
    // Fill template with context data
    let questionText = this.fillTemplate(template.template, context, product);
    
    // Add some natural variation
    if (Math.random() > 0.5 && template.variants.length > 0) {
      const variant = template.variants[Math.floor(Math.random() * template.variants.length)];
      questionText = this.fillTemplate(variant, context, product);
    }

    return {
      id: `${product.id}-${questionId}`,
      questionId: questionId,
      dimension: dimension,
      text: questionText,
      expectedProduct: product.name,
      productCategory: product.category,
      metadata: {
        templateUsed: template.template,
        context: context,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Create context data specific to a product
   */
  createProductContext(product) {
    const context = {
      productName: product.name,
      productType: this.getProductType(product),
      functionality: this.getFunctionality(product),
      targetUser: this.getTargetUser(product),
      specificTask: this.getSpecificTask(product),
      workType: this.getWorkType(product),
      industry: this.getRandomFromArray(this.contextData.industries),
      skillLevel: this.getRandomFromArray(this.contextData.skillLevels),
      domain: this.getDomain(product),
      productFunction: this.getProductFunction(product),
      budget: this.getRandomFromArray(this.contextData.budgets),
      userType: this.getRandomFromArray(this.contextData.userTypes),
      competitor: this.getCompetitor(product)
    };

    return context;
  }

  /**
   * Fill template placeholders with context data
   */
  fillTemplate(template, context, product) {
    let filled = template;
    
    // Replace placeholders with context values
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{${key}}`;
      filled = filled.replace(new RegExp(placeholder, 'g'), value);
    }

    return filled;
  }

  /**
   * Helper methods to extract product-specific information
   */
  getProductType(product) {
    const category = product.category.toLowerCase();
    if (category.includes('video')) return 'video editing';
    if (category.includes('design') || category.includes('creative')) return 'design';
    if (category.includes('photo')) return 'photo editing';
    if (category.includes('3d')) return '3D modeling';
    if (category.includes('pdf')) return 'PDF editing';
    if (category.includes('audio')) return 'audio editing';
    return 'creative';
  }

  getFunctionality(product) {
    const name = product.name.toLowerCase();
    if (name.includes('photoshop')) return 'image editing and retouching';
    if (name.includes('premiere')) return 'video editing and production';
    if (name.includes('illustrator')) return 'vector graphics and illustration';
    if (name.includes('lightroom')) return 'photo organization and editing';
    if (name.includes('after effects')) return 'motion graphics and visual effects';
    if (name.includes('acrobat')) return 'PDF creation and editing';
    if (name.includes('express')) return 'quick design and social media content';
    if (name.includes('substance')) return '3D texturing and modeling';
    return `${product.category.toLowerCase()} work`;
  }

  getTargetUser(product) {
    if (product.targetUsers && product.targetUsers.length > 0) {
      return this.getRandomFromArray(product.targetUsers);
    }
    
    // Default target users based on category
    const category = product.category.toLowerCase();
    if (category.includes('professional') || category.includes('3d')) return 'professionals';
    if (category.includes('express') || category.includes('quick')) return 'beginners';
    return 'creatives';
  }

  getSpecificTask(product) {
    const name = product.name.toLowerCase();
    const tasks = {
      'photoshop': ['remove backgrounds and add effects', 'retouch product photos', 'create digital artwork'],
      'premiere': ['edit YouTube videos', 'create social media content', 'produce marketing videos'],
      'illustrator': ['create logos and branding', 'design vector illustrations', 'make print layouts'],
      'lightroom': ['organize and edit photos', 'batch process images', 'create photo collections'],
      'express': ['create Instagram posts', 'design quick flyers', 'make social media graphics'],
      'acrobat': ['edit PDF documents', 'create interactive forms', 'add digital signatures'],
      'substance': ['create 3D textures', 'model game assets', 'render realistic materials']
    };

    for (const [key, taskList] of Object.entries(tasks)) {
      if (name.includes(key)) {
        return this.getRandomFromArray(taskList);
      }
    }

    return 'create professional content';
  }

  getWorkType(product) {
    const category = product.category.toLowerCase();
    if (category.includes('video')) return 'video production';
    if (category.includes('design')) return 'graphic design';
    if (category.includes('photo')) return 'photography';
    if (category.includes('3d')) return '3D visualization';
    if (category.includes('pdf')) return 'document management';
    return 'creative';
  }

  getDomain(product) {
    return this.getProductType(product).replace(' editing', '').replace(' modeling', '');
  }

  getProductFunction(product) {
    return this.getProductType(product);
  }

  getCompetitor(product) {
    const productType = this.getProductType(product);
    const competitors = this.contextData.competitors[productType];
    if (competitors) {
      return this.getRandomFromArray(competitors);
    }
    return 'other alternatives';
  }

  getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Load existing questions from file
   */
  async loadQuestions() {
    try {
      const questionsPath = path.join(config.output.questionsDir, 'golden-questions.json');
      if (await fs.pathExists(questionsPath)) {
        console.log(chalk.blue('📂 Loading existing questions...'));
        const data = await fs.readJson(questionsPath);
        console.log(chalk.green(`✅ Loaded ${data.metadata.totalQuestions} questions`));
        return data.questions;
      }
      return null;
    } catch (error) {
      console.error(chalk.red('❌ Error loading questions:'), error.message);
      return null;
    }
  }

  /**
   * Generate questions for specific products only
   */
  async generateQuestionsForProducts(products, productIds) {
    const filteredProducts = products.filter(p => productIds.includes(p.id));
    return this.generateAllQuestions(filteredProducts);
  }
}

module.exports = GoldenQuestionGenerator;
