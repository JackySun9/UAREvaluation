const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('../../config/config');

class BrandConciergeTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = [];
    this.currentTestSession = null;
  }

  /**
   * Initialize browser and navigation
   */
  async initialize() {
    try {
      console.log(chalk.blue('🔄 Initializing browser...'));
      
      this.browser = await chromium.launch({
        headless: config.browser.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Create browser context with user agent
      this.context = await this.browser.newContext({
        userAgent: config.browser.userAgent,
        viewport: config.browser.viewport
      });

      this.page = await this.context.newPage();
      
      // Set up response capture
      this.setupResponseCapture();
      
      console.log(chalk.green('✅ Browser initialized successfully'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Error initializing browser:'), error.message);
      throw error;
    }
  }

  /**
   * Navigate to Brand Concierge
   */
  async navigateToSite() {
    try {
      console.log(chalk.blue('🌐 Navigating to Brand Concierge...'));
      
      await this.page.goto(config.brandConcierge.url, {
        waitUntil: 'networkidle',
        timeout: config.brandConcierge.waitTimeout
      });

      // Wait for the chat interface to load
      await this.waitForChatInterface();
      
      console.log(chalk.green('✅ Successfully navigated to Brand Concierge'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Error navigating to site:'), error.message);
      throw error;
    }
  }

  /**
   * Wait for chat interface to be ready
   */
  async waitForChatInterface() {
    try {
      // Common selectors for chat interfaces
      const possibleSelectors = [
        '#bc-input-field',  // Brand Concierge specific
        'input[type="text"]',
        'textarea',
        '[placeholder*="ask"]',
        '[placeholder*="question"]',
        '[placeholder*="message"]',
        '.chat-input',
        '.message-input',
        '#chat-input',
        '[data-testid*="input"]',
        '[role="textbox"]'
      ];

      let chatInputFound = false;
      
      for (const selector of possibleSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          console.log(chalk.green(`✅ Found chat input with selector: ${selector}`));
          this.chatInputSelector = selector;
          chatInputFound = true;
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!chatInputFound) {
        // Take a screenshot for debugging
        await this.takeDebugScreenshot('chat-interface-not-found');
        throw new Error('Chat interface not found');
      }

      // Wait for input to be fully ready and enabled
      await this.waitForInputReady();
      
    } catch (error) {
      console.error(chalk.red('❌ Error waiting for chat interface:'), error.message);
      throw error;
    }
  }

  /**
   * Wait for input field to be ready (visible, enabled, and editable)
   */
  async waitForInputReady() {
    try {
      // Wait for the input to be enabled and ready
      await this.page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          return element && 
                 !element.disabled && 
                 element.style.display !== 'none' && 
                 element.offsetWidth > 0 && 
                 element.offsetHeight > 0;
        },
        this.chatInputSelector,
        { timeout: 15000 }
      );
      
      // Additional wait for stability
      await this.page.waitForTimeout(1000);
      
      console.log(chalk.gray('✅ Input field is ready'));
    } catch (error) {
      console.error(chalk.yellow('⚠️ Input ready check failed, but continuing...'));
      // Take screenshot for debugging but don't fail
      await this.takeDebugScreenshot('input-not-ready');
    }
  }

  /**
   * Test a single question
   */
  async testQuestion(questionData) {
    try {
      console.log(chalk.blue(`🔄 Testing question: ${questionData.id}`));
      
      const testStart = Date.now();
      
      // Clear any existing text and input the question
      await this.inputQuestion(questionData.text);
      
      // Submit the question
      await this.submitQuestion();
      
      // Wait for and capture response
      const response = await this.captureResponse();
      
      const testEnd = Date.now();
      const responseTime = testEnd - testStart;
      
      // Create test result object
      const result = {
        questionId: questionData.id,
        question: questionData.text,
        expectedProduct: questionData.expectedProduct,
        productCategory: questionData.productCategory,
        dimension: questionData.dimension,
        response: response,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        metadata: {
          ...questionData.metadata,
          testSession: this.currentTestSession
        }
      };

      this.testResults.push(result);
      
      console.log(chalk.green(`✅ Question tested successfully (${responseTime}ms)`));
      
      // Add delay between questions to avoid rate limiting
      if (config.execution.delayBetweenQuestions > 0) {
        await this.page.waitForTimeout(config.execution.delayBetweenQuestions);
      }
      
      return result;
      
    } catch (error) {
      console.error(chalk.red(`❌ Error testing question ${questionData.id}:`), error.message);
      
      // Create error result
      const errorResult = {
        questionId: questionData.id,
        question: questionData.text,
        expectedProduct: questionData.expectedProduct,
        productCategory: questionData.productCategory,
        dimension: questionData.dimension,
        response: null,
        error: error.message,
        responseTime: null,
        timestamp: new Date().toISOString(),
        metadata: questionData.metadata
      };
      
      this.testResults.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Input question into chat interface
   */
  async inputQuestion(questionText) {
    try {
      // Wait for input to be ready before attempting to fill
      await this.waitForInputReady();
      
      // Try alternative approaches if regular fill fails
      let inputSuccess = false;
      
      // Method 1: Regular fill and type
      try {
        await this.page.fill(this.chatInputSelector, '', { timeout: 10000 });
        await this.page.type(this.chatInputSelector, questionText, { delay: 50 });
        inputSuccess = true;
      } catch (fillError) {
        console.log(chalk.yellow('⚠️ Regular fill failed, trying alternative methods...'));
      }
      
      // Method 2: Focus and clear, then type
      if (!inputSuccess) {
        try {
          await this.page.focus(this.chatInputSelector);
          await this.page.keyboard.press('Control+A');
          await this.page.keyboard.press('Delete');
          await this.page.keyboard.type(questionText, { delay: 50 });
          inputSuccess = true;
        } catch (focusError) {
          console.log(chalk.yellow('⚠️ Focus method failed, trying JavaScript...'));
        }
      }
      
      // Method 3: Direct JavaScript manipulation
      if (!inputSuccess) {
        await this.page.evaluate((selector, text) => {
          const element = document.querySelector(selector);
          if (element) {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, this.chatInputSelector, questionText);
        inputSuccess = true;
      }
      
      if (inputSuccess) {
        // Wait a moment for any auto-suggestions to load
        await this.page.waitForTimeout(1000);
        console.log(chalk.gray(`✅ Question input successful: "${questionText.substring(0, 50)}..."`));
      } else {
        throw new Error('All input methods failed');
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error inputting question:'), error.message);
      await this.takeDebugScreenshot('input-question-error');
      throw error;
    }
  }

  /**
   * Submit the question
   */
  async submitQuestion() {
    try {
      // Try different submission methods
      const submissionMethods = [
        // Method 1: Press Enter
        async () => {
          await this.page.press(this.chatInputSelector, 'Enter');
        },
        // Method 2: Click submit button
        async () => {
          const submitButton = await this.page.$('button[type="submit"], .submit-button, [data-testid*="submit"]');
          if (submitButton) {
            await submitButton.click();
          } else {
            throw new Error('Submit button not found');
          }
        },
        // Method 3: Look for send/arrow buttons
        async () => {
          const sendButton = await this.page.$('button:has-text("Send"), button[aria-label*="send"], .send-button');
          if (sendButton) {
            await sendButton.click();
          } else {
            throw new Error('Send button not found');
          }
        }
      ];

      let submitted = false;
      for (const method of submissionMethods) {
        try {
          await method();
          submitted = true;
          break;
        } catch (e) {
          // Try next method
        }
      }

      if (!submitted) {
        throw new Error('Could not submit question - no valid submission method found');
      }

    } catch (error) {
      console.error(chalk.red('❌ Error submitting question:'), error.message);
      throw error;
    }
  }

  /**
   * Capture the response from Brand Concierge
   */
  async captureResponse() {
    try {
      // Wait longer for response to appear and complete
      console.log(chalk.gray('   Waiting for response...'));
      
      // Wait for response generation to complete
      let responseReady = false;
      let attemptCount = 0;
      const maxAttempts = 60; // 60 seconds max wait for AI generation
      let lastResponseText = '';
      
      while (!responseReady && attemptCount < maxAttempts) {
        await this.page.waitForTimeout(2000); // Check every 2 seconds
        attemptCount++;
        
        try {
          // Get current page text to check for response changes
          const currentPageText = await this.page.innerText('body');
          
          // Check if we still see "generating" messages
          const isStillGenerating = currentPageText.toLowerCase().includes('generating') ||
                                   currentPageText.toLowerCase().includes('knowledge base') ||
                                   currentPageText.toLowerCase().includes('please wait');
          
          // Check if input is enabled AND we don't see generating messages
          const isInputEnabled = await this.page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element && !element.disabled;
          }, this.chatInputSelector);
          
          // Look for actual response content (substantial text that's not generating messages)
          const hasSubstantialResponse = await this.page.evaluate(() => {
            const bodyText = document.body.innerText;
            const lines = bodyText.split('\n').filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 30 && 
                     !trimmed.toLowerCase().includes('generating') &&
                     !trimmed.toLowerCase().includes('knowledge base') &&
                     !trimmed.toLowerCase().includes('tell us what') &&
                     !trimmed.toLowerCase().includes('or create') &&
                     (trimmed.toLowerCase().includes('adobe') || 
                      trimmed.toLowerCase().includes('recommend') ||
                      trimmed.toLowerCase().includes('suggest') ||
                      trimmed.toLowerCase().includes('perfect') ||
                      trimmed.toLowerCase().includes('ideal'));
            });
            return lines.length > 0;
          });
          
          if (isInputEnabled && !isStillGenerating && hasSubstantialResponse) {
            responseReady = true;
            console.log(chalk.gray(`   ✅ Complete response detected after ${attemptCount * 2}s`));
          } else if (attemptCount % 5 === 0) { // Log every 10 seconds
            const status = isStillGenerating ? 'still generating' : 
                          !isInputEnabled ? 'input disabled' : 
                          'waiting for substantial response';
            console.log(chalk.gray(`   ⏳ ${status}... (${attemptCount * 2}s)`));
          }
        } catch (e) {
          // Continue waiting
        }
      }
      
      if (!responseReady) {
        console.log(chalk.yellow(`⚠️ Timeout after ${maxAttempts * 2}s, capturing whatever response is available`));
      }
      
      // Additional wait for stability
      await this.page.waitForTimeout(2000);
      
      // Enhanced response extraction that filters out generating messages
      let responseText = '';
      
      // Method 1: Look for specific response elements
      const responseSelectors = [
        '.bc-response',
        '.bc-message', 
        '.response',
        '.message',
        '.chat-message',
        '[data-testid*="message"]',
        '[data-testid*="response"]',
        '.bot-message',
        '.assistant-message',
        '.bc-output'
      ];

      for (const selector of responseSelectors) {
        try {
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            for (const element of elements.reverse()) { // Start with most recent
              const text = await element.innerText();
              if (this.isValidResponse(text)) {
                responseText = text;
                break;
              }
            }
            if (responseText) break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Method 2: Smart text extraction from page
      if (!responseText.trim()) {
        try {
          const bodyText = await this.page.innerText('body');
          const potentialResponses = bodyText.split('\n').filter(line => {
            return this.isValidResponse(line.trim());
          });
          
          if (potentialResponses.length > 0) {
            // Get the longest valid response (likely the most complete)
            responseText = potentialResponses.reduce((longest, current) => 
              current.length > longest.length ? current : longest, '');
          }
        } catch (e) {
          console.log(chalk.yellow('⚠️ Smart text extraction failed'));
        }
      }

      // Method 3: Look for Adobe-specific responses
      if (!responseText.trim()) {
        try {
          const allText = await this.page.innerText('body');
          const adobeResponses = allText.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 50 && 
                   this.containsAdobeRecommendation(trimmed) &&
                   !this.isGeneratingMessage(trimmed);
          });
          
          if (adobeResponses.length > 0) {
            responseText = adobeResponses[0]; // First Adobe-specific response
          }
        } catch (e) {
          console.log(chalk.yellow('⚠️ Adobe-specific extraction failed'));
        }
      }

      // Validation and fallback
      if (!responseText.trim() || responseText.length < 20 || this.isGeneratingMessage(responseText)) {
        await this.takeDebugScreenshot('no-valid-response');
        console.log(chalk.red('❌ No valid response found after generation completed'));
        
        // Last resort - capture page text but mark as incomplete
        try {
          const pageText = await this.page.innerText('body');
          responseText = `Response capture failed. Page content: ${pageText.substring(0, 200)}...`;
        } catch (e) {
          responseText = 'Complete response capture failure - check debug screenshots';
        }
      }

      // Clean up response text
      responseText = responseText.trim();
      
      const isValidCapture = !this.isGeneratingMessage(responseText);
      const captureStatus = isValidCapture ? '✅ Valid response' : '⚠️ Possibly incomplete';
      
      console.log(chalk.gray(`   ${captureStatus} captured (${responseText.length} chars): ${responseText.substring(0, 100)}...`));
      
      return {
        text: responseText,
        capturedAt: new Date().toISOString(),
        method: 'enhanced-extraction'
      };

    } catch (error) {
      console.error(chalk.red('❌ Error capturing response:'), error.message);
      
      // Try to get page content as fallback
      try {
        await this.takeDebugScreenshot('response-capture-error');
        const pageText = await this.page.innerText('body');
        return {
          text: pageText.substring(0, 500), // Limit fallback text
          capturedAt: new Date().toISOString(),
          method: 'fallback-page-text',
          error: error.message
        };
      } catch (fallbackError) {
        throw new Error(`Failed to capture response: ${error.message}`);
      }
    }
  }

  /**
   * Set up response capture mechanisms
   */
  setupResponseCapture() {
    // Monitor network requests for API calls
    this.page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('api') || url.includes('chat') || url.includes('assistant')) {
        try {
          const responseData = await response.json();
          // Store API responses for analysis
          if (!this.apiResponses) this.apiResponses = [];
          this.apiResponses.push({
            url,
            data: responseData,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          // Not JSON response, ignore
        }
      }
    });
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(context) {
    try {
      const screenshotPath = path.join(config.output.resultsDir, 'debug-screenshots', `${context}-${Date.now()}.png`);
      await fs.ensureDir(path.dirname(screenshotPath));
      await this.page.screenshot({ path: screenshotPath });
      console.log(chalk.yellow(`📸 Debug screenshot saved: ${screenshotPath}`));
    } catch (error) {
      console.error(chalk.red('❌ Error taking screenshot:'), error.message);
    }
  }

  /**
   * Test multiple questions in parallel using multiple browser instances
   */
  async testQuestionsParallel(questions, options = {}) {
    try {
      const concurrency = options.concurrency || 3; // Max 3 parallel browser instances
      const limit = options.limit || questions.length;
      const questionsToTest = questions.slice(0, limit);
      
      console.log(chalk.blue(`🚀 Testing ${questionsToTest.length} questions with ${concurrency} parallel browser instances...`));
      
      // Split questions into batches for parallel processing
      const batches = [];
      for (let i = 0; i < questionsToTest.length; i += concurrency) {
        batches.push(questionsToTest.slice(i, i + concurrency));
      }
      
      const allResults = [];
      let successCount = 0;
      let failCount = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(chalk.gray(`\nProcessing batch ${batchIndex + 1}/${batches.length} (${batch.length} questions)`));
        
        // Create parallel promises for this batch - each with its own browser instance
        const batchPromises = batch.map((question, index) => 
          this.testSingleQuestionWithOwnBrowser(question, batchIndex * concurrency + index + 1)
        );
        
        // Wait for all questions in this batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process batch results
        for (let i = 0; i < batchResults.length; i++) {
          if (batchResults[i].status === 'fulfilled') {
            allResults.push(batchResults[i].value);
            successCount++;
            console.log(chalk.green(`[${batchIndex * concurrency + i + 1}/${questionsToTest.length}] ✅ Completed`));
          } else {
            console.log(chalk.red(`[${batchIndex * concurrency + i + 1}/${questionsToTest.length}] ❌ Failed: ${batchResults[i].reason}`));
            failCount++;
          }
        }
        
        // Brief pause between batches to avoid overwhelming the server
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Save results
      const outputPath = path.join(config.output.resultsDir, `test-results-parallel-${Date.now()}.json`);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeJson(outputPath, allResults, { spaces: 2 });
      
      console.log(chalk.green(`✅ Parallel testing completed`));
      console.log(chalk.gray(`   Successful: ${successCount}`));
      console.log(chalk.gray(`   Failed: ${failCount}`));
      console.log(chalk.gray(`   Success rate: ${((successCount / questionsToTest.length) * 100).toFixed(1)}%`));
      console.log(chalk.gray(`   Results saved: ${outputPath}`));
      
      return allResults;
      
    } catch (error) {
      console.error(chalk.red('❌ Error in parallel testing:'), error.message);
      throw error;
    }
  }

  /**
   * Test a single question with its own dedicated browser instance
   */
  async testSingleQuestionWithOwnBrowser(question, questionNumber) {
    const startTime = Date.now();
    let browser = null;
    let page = null;
    
    try {
      console.log(chalk.gray(`[${questionNumber}] 🚀 Launching browser instance...`));
      
      // Launch separate browser instance for this question
      browser = await chromium.launch({
        headless: config.browser.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Create context and page
      const context = await browser.newContext({
        userAgent: config.browser.userAgent,
        viewport: config.browser.viewport
      });
      
      page = await context.newPage();
      
      console.log(chalk.gray(`[${questionNumber}] 🌐 Navigating to Brand Concierge...`));
      
      // Navigate to Brand Concierge
      await page.goto(config.brandConcierge.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for chat interface
      const chatInputSelector = await this.findChatInputSelector(page);
      if (!chatInputSelector) {
        throw new Error('Chat input not found');
      }
      
      // Wait for input to be ready
      await page.waitForFunction((selector) => {
        const element = document.querySelector(selector);
        return element && 
               element.offsetParent !== null && 
               !element.disabled && 
               !element.readOnly;
      }, chatInputSelector, { timeout: 30000 });
      
      console.log(chalk.gray(`[${questionNumber}] 💬 Asking: ${question.text.substring(0, 50)}...`));
      
      // Input question
      await page.fill(chatInputSelector, question.text);
      await page.press(chatInputSelector, 'Enter');
      
      // Capture response with shorter timeout for parallel processing
      const response = await this.captureResponseParallel(page);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = {
        questionId: question.id,
        question: question.text,
        expectedProduct: question.expectedProduct,
        productCategory: question.productCategory,
        dimension: question.dimension,
        response: response,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        metadata: question.metadata
      };
      
      console.log(chalk.gray(`[${questionNumber}] 🔒 Closing browser instance...`));
      await browser.close();
      return result;
      
    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error(chalk.red(`[${questionNumber}] Error closing browser:`, closeError.message));
        }
      }
      throw new Error(`Question ${questionNumber}: ${error.message}`);
    }
  }

  /**
   * Test a single question in a separate browser context (legacy method)
   */
  async testSingleQuestionParallel(question, questionNumber) {
    const startTime = Date.now();
    let context = null;
    let page = null;
    
    try {
      // Create new browser context for this question
      context = await this.browser.newContext({
        userAgent: config.browser.userAgent,
        viewport: config.browser.viewport
      });
      
      page = await context.newPage();
      
      // Navigate to Brand Concierge
      await page.goto(config.brandConcierge.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for chat interface
      const chatInputSelector = await this.findChatInputSelector(page);
      if (!chatInputSelector) {
        throw new Error('Chat input not found');
      }
      
      // Wait for input to be ready
      await page.waitForFunction((selector) => {
        const element = document.querySelector(selector);
        return element && 
               element.offsetParent !== null && 
               !element.disabled && 
               !element.readOnly;
      }, chatInputSelector, { timeout: 30000 });
      
      // Input question
      await page.fill(chatInputSelector, question.text);
      await page.press(chatInputSelector, 'Enter');
      
      // Capture response with shorter timeout for parallel processing
      const response = await this.captureResponseParallel(page);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = {
        questionId: question.id,
        question: question.text,
        expectedProduct: question.expectedProduct,
        productCategory: question.productCategory,
        dimension: question.dimension,
        response: response,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        metadata: question.metadata
      };
      
      await context.close();
      return result;
      
    } catch (error) {
      if (context) await context.close();
      throw new Error(`Question ${questionNumber}: ${error.message}`);
    }
  }

  /**
   * Optimized response capture for parallel processing
   */
  async captureResponseParallel(page) {
    try {
      let responseReady = false;
      let attemptCount = 0;
      const maxAttempts = 60; // Same as sequential for reliability
      
      while (!responseReady && attemptCount < maxAttempts) {
        await page.waitForTimeout(2000); // Check every 2 seconds like sequential
        attemptCount++;
        
        try {
          const currentPageText = await page.innerText('body');
          const isStillGenerating = currentPageText.toLowerCase().includes('generating') ||
                                   currentPageText.toLowerCase().includes('knowledge base') ||
                                   currentPageText.toLowerCase().includes('please wait');
          
          const inputElements = await page.$$('#bc-input-field, input[type="text"], textarea');
          const isInputEnabled = inputElements.length > 0 && 
                                await page.evaluate((elements) => {
                                  return elements.some(el => !el.disabled);
                                }, inputElements);
          
          const hasSubstantialResponse = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const lines = bodyText.split('\n').filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 30 &&
                     !trimmed.toLowerCase().includes('generating') &&
                     !trimmed.toLowerCase().includes('knowledge base') &&
                     !trimmed.toLowerCase().includes('tell us what') &&
                     !trimmed.toLowerCase().includes('or create') &&
                     !trimmed.toLowerCase().includes('copyright') &&
                     !trimmed.toLowerCase().includes('privacy policy') &&
                     !trimmed.toLowerCase().includes('terms') &&
                     (trimmed.toLowerCase().includes('adobe') ||
                      trimmed.toLowerCase().includes('recommend') ||
                      trimmed.toLowerCase().includes('suggest') ||
                      trimmed.toLowerCase().includes('perfect') ||
                      trimmed.toLowerCase().includes('ideal'));
            });
            return lines.length > 0;
          });
          
          if (isInputEnabled && !isStillGenerating && hasSubstantialResponse) {
            responseReady = true;
          }
        } catch (e) {
          // Continue waiting
        }
      }
      
      // Additional wait for stability
      await page.waitForTimeout(2000);
      
      // Extract response text
      const responseText = await this.extractResponseTextParallel(page);
      
      return {
        text: responseText,
        capturedAt: new Date().toISOString(),
        method: 'parallel-extraction'
      };
      
    } catch (error) {
      throw new Error(`Response capture failed: ${error.message}`);
    }
  }

  /**
   * Optimized response text extraction for parallel processing (using same logic as sequential)
   */
  async extractResponseTextParallel(page) {
    try {
      let responseText = '';
      
      // Method 1: Look for specific response elements (same selectors as sequential)
      const responseSelectors = [
        '.bc-response',
        '.bc-message', 
        '.response',
        '.message',
        '.chat-message',
        '[data-testid*="message"]',
        '[data-testid*="response"]',
        '.bot-message',
        '.assistant-message',
        '.bc-output'
      ];

      for (const selector of responseSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            for (const element of elements.reverse()) { // Start with most recent
              const text = await element.innerText();
              if (this.isValidResponse(text)) {
                responseText = text;
                break;
              }
            }
            if (responseText) break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Method 2: Smart text extraction from page (same as sequential)
      if (!responseText.trim()) {
        try {
          const bodyText = await page.innerText('body');
          const potentialResponses = bodyText.split('\n').filter(line => {
            return this.isValidResponse(line.trim());
          });
          
          if (potentialResponses.length > 0) {
            // Get the longest valid response (likely the most complete)
            responseText = potentialResponses.reduce((longest, current) => 
              current.length > longest.length ? current : longest, '');
          }
        } catch (e) {
          // Continue to next method
        }
      }

      // Method 3: Look for Adobe-specific responses (same as sequential)
      if (!responseText.trim()) {
        try {
          const allText = await page.innerText('body');
          const adobeResponses = allText.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 50 && 
                   this.containsAdobeRecommendation(trimmed) &&
                   !this.isGeneratingMessage(trimmed);
          });
          
          if (adobeResponses.length > 0) {
            responseText = adobeResponses[0]; // First Adobe-specific response
          }
        } catch (e) {
          // Continue
        }
      }

      // Validation and fallback (same as sequential)
      if (!responseText.trim() || responseText.length < 20 || this.isGeneratingMessage(responseText)) {
        // Last resort - capture page text but mark as incomplete
        try {
          const pageText = await page.innerText('body');
          responseText = `Response capture failed. Page content: ${pageText.substring(0, 200)}...`;
        } catch (e) {
          responseText = 'Complete response capture failure - check debug screenshots';
        }
      }

      // Clean up response text
      return responseText.trim();
      
    } catch (error) {
      return `Extraction error: ${error.message}`;
    }
  }

  /**
   * Find chat input selector across different possible selectors
   */
  async findChatInputSelector(page) {
    const selectors = [
      '#bc-input-field',
      'input[placeholder*="ask"]',
      'input[placeholder*="question"]', 
      'textarea[placeholder*="ask"]',
      'textarea[placeholder*="question"]',
      'input[type="text"]',
      'textarea'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el && el.offsetParent !== null;
          }, selector);
          
          if (isVisible) {
            return selector;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Test multiple questions in sequence (original method)
   */
  async testQuestions(questions) {
    try {
      console.log(chalk.blue(`🔄 Testing ${questions.length} questions...`));
      
      this.currentTestSession = `session-${Date.now()}`;
      const results = [];
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(chalk.blue(`[${i + 1}/${questions.length}] Testing: ${question.text.substring(0, 60)}...`));
        
        try {
          // Refresh page between questions if configured (except for first question)
          if (i > 0 && config.execution.refreshPageBetweenQuestions) {
            console.log(chalk.gray('   Refreshing page for next question...'));
            await this.page.reload({ waitUntil: 'networkidle' });
            await this.waitForChatInterface();
          }
          
          const result = await this.testQuestion(question);
          results.push(result);
          
          // Save intermediate results every 5 questions (matches reduced batch size)
          if ((i + 1) % 5 === 0) {
            await this.saveResults(results, `intermediate-${i + 1}`);
          }
          
        } catch (error) {
          console.error(chalk.red(`❌ Failed to test question ${i + 1}:`), error.message);
          
          // Add error result to maintain sequence
          const errorResult = {
            questionId: question.id,
            question: question.text,
            expectedProduct: question.expectedProduct,
            productCategory: question.productCategory,
            dimension: question.dimension,
            response: null,
            error: error.message,
            responseTime: null,
            timestamp: new Date().toISOString(),
            metadata: question.metadata
          };
          results.push(errorResult);
          
          // Take screenshot for debugging
          await this.takeDebugScreenshot(`question-${i + 1}-error`);
          continue;
        }
      }
      
      console.log(chalk.green(`✅ Completed testing ${results.length} questions`));
      return results;
      
    } catch (error) {
      console.error(chalk.red('❌ Error testing questions:'), error.message);
      throw error;
    }
  }

  /**
   * Save test results to file
   */
  async saveResults(results = null, suffix = '') {
    try {
      const resultsToSave = results || this.testResults;
      const filename = suffix ? `test-results-${suffix}.json` : 'test-results.json';
      const resultsPath = path.join(config.output.resultsDir, filename);
      
      await fs.ensureDir(path.dirname(resultsPath));
      
      const saveData = {
        metadata: {
          totalQuestions: resultsToSave.length,
          testSession: this.currentTestSession,
          completedAt: new Date().toISOString(),
          browserConfig: config.browser,
          executionConfig: config.execution
        },
        results: resultsToSave
      };
      
      await fs.writeJson(resultsPath, saveData, { spaces: 2 });
      
      console.log(chalk.green(`✅ Results saved: ${resultsPath}`));
      return resultsPath;
      
    } catch (error) {
      console.error(chalk.red('❌ Error saving results:'), error.message);
      throw error;
    }
  }

  /**
   * Close browser and cleanup
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log(chalk.green('✅ Browser cleanup completed'));
    } catch (error) {
      console.error(chalk.red('❌ Error during cleanup:'), error.message);
    }
  }

  /**
   * Get test results
   */
  getResults() {
    return {
      totalTests: this.testResults.length,
      successful: this.testResults.filter(r => !r.error).length,
      failed: this.testResults.filter(r => r.error).length,
      averageResponseTime: this.calculateAverageResponseTime(),
      results: this.testResults
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const validResults = this.testResults.filter(r => r.responseTime && !r.error);
    if (validResults.length === 0) return 0;
    
    const totalTime = validResults.reduce((sum, r) => sum + r.responseTime, 0);
    return Math.round(totalTime / validResults.length);
  }

  /**
   * Check if text is a valid response (not a loading/generating message)
   */
  isValidResponse(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    
    // Must be substantial length
    if (trimmed.length < 30) return false;
    
    // Must not be a generating message
    if (this.isGeneratingMessage(trimmed)) return false;
    
    // Must not be UI text
    if (this.isUIText(trimmed)) return false;
    
    // Should contain recommendation language or Adobe mentions
    const hasRecommendationLanguage = /\b(recommend|suggest|perfect|ideal|great|best|try|use|consider|adobe)\b/i.test(trimmed);
    
    return hasRecommendationLanguage;
  }

  /**
   * Check if text is a generating/loading message
   */
  isGeneratingMessage(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const generatingPhrases = [
      'generating response',
      'knowledge base',
      'please wait',
      'loading',
      'processing',
      'thinking',
      'one moment',
      'generating from our',
      'hold on'
    ];
    
    return generatingPhrases.some(phrase => lowerText.includes(phrase));
  }

  /**
   * Check if text is UI/navigation text rather than response content
   */
  isUIText(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const uiPhrases = [
      'tell us what you',
      'or create',
      'type your message',
      'send message',
      'clear conversation',
      'start new chat'
    ];
    
    return uiPhrases.some(phrase => lowerText.includes(phrase)) ||
           /^[\d\s\-\+\*\.]+$/.test(text.trim()); // Just numbers/symbols
  }

  /**
   * Check if text contains Adobe product recommendations
   */
  containsAdobeRecommendation(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    // Must mention Adobe
    if (!lowerText.includes('adobe')) return false;
    
    // Adobe product names
    const adobeProducts = [
      'photoshop', 'illustrator', 'premiere', 'after effects', 'lightroom',
      'indesign', 'acrobat', 'express', 'substance', 'dimension', 'animate',
      'audition', 'bridge', 'character animator', 'creative cloud'
    ];
    
    const mentionsProduct = adobeProducts.some(product => lowerText.includes(product));
    
    // Recommendation language
    const hasRecommendation = /\b(recommend|suggest|perfect|ideal|great|best|try|use)\b/i.test(text);
    
    return mentionsProduct && hasRecommendation;
  }
}

module.exports = BrandConciergeTester;
