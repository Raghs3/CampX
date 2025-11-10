/**
 * Price Prediction API for CampX Marketplace
 * Integrates with Google Gemini AI for intelligent price predictions
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Call Gemini AI model to predict price
 * @param {string} category - Product category
 * @param {string} condition - Product condition
 * @param {string} title - Product title (optional)
 * @param {string} description - Product description (optional)
 * @param {number} userPrice - User's entered price (optional)
 * @returns {Promise} Price prediction result
 */
function predictPrice(category, condition, title = '', description = '', userPrice = 0) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ai_gemini_predictor.py');
    
    // Use venv Python if available, otherwise system Python
    const pythonCmd = process.platform === 'win32' 
      ? path.join(__dirname, '../venv/Scripts/python.exe')
      : path.join(__dirname, '../venv/bin/python');
    
    // Check if venv Python exists, otherwise use system python
    const fs = require('fs');
    const pythonExe = fs.existsSync(pythonCmd) ? pythonCmd : 'python';
    
    console.log('🐍 Using Python:', pythonExe);
    
    // Build arguments
    const args = [pythonScript, category, condition];
    if (title) args.push(title);
    if (description) args.push(description);
    if (userPrice) args.push(userPrice.toString());
    
    console.log('🤖 Calling AI predictor:', args.join(' '));
    
    // Spawn Python process
    const pythonProcess = spawn(pythonExe, args);
    
    let dataString = '';
    let errorString = '';
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    // Process result
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorString);
        reject(new Error('Price prediction failed: ' + errorString));
        return;
      }
      
      try {
        // Find JSON in output (last line should be JSON)
        const lines = dataString.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const result = JSON.parse(jsonLine);
        resolve(result);
      } catch (err) {
        console.error('Failed to parse prediction result:', dataString);
        reject(new Error('Failed to parse price prediction'));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(new Error('Failed to start Python process: ' + err.message));
    });
  });
}

module.exports = {
  predictPrice
};
