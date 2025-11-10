/**
 * Image Analysis Module - Node.js wrapper for AI image analyzer
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Analyze product image(s) using AI
 * @param {string|string[]} imagePaths - Single path or array of paths to uploaded images
 * @returns {Promise<Object>} Analysis result with product details and legitimacy check
 */
function analyzeImage(imagePaths) {
    return new Promise((resolve, reject) => {
        // Convert single path to array for uniform processing
        const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
        
        // Determine Python executable path
        let pythonCmd = 'python';
        
        // Check for venv Python first (Windows)
        const venvPythonWin = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
        if (fs.existsSync(venvPythonWin)) {
            pythonCmd = venvPythonWin;
            console.log('🐍 Using venv Python (Windows)');
        } else {
            // Check for venv Python (Unix/Linux/Mac)
            const venvPythonUnix = path.join(__dirname, '..', 'venv', 'bin', 'python');
            if (fs.existsSync(venvPythonUnix)) {
                pythonCmd = venvPythonUnix;
                console.log('🐍 Using venv Python (Unix)');
            } else {
                console.log('🐍 Using system Python');
            }
        }

        const scriptPath = path.join(__dirname, '..', 'ai_image_analyzer.py');
        
        console.log(`🔍 Analyzing ${paths.length} image(s): ${paths.join(', ')}`);
        
        // Pass all image paths as arguments
        const pythonProcess = spawn(pythonCmd, [scriptPath, ...paths]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.log(`Python: ${data.toString().trim()}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Python process exited with code ${code}`);
                console.error(`Error: ${errorOutput}`);
                reject(new Error(`Image analysis failed: ${errorOutput}`));
                return;
            }
            
            try {
                // Remove debug output (stderr) and parse the stdout as JSON
                // The entire stdout should be the JSON result
                const jsonOutput = output.trim();
                
                // If there are multiple lines, try to find the JSON object
                // Look for lines starting with { and ending with }
                let jsonString = jsonOutput;
                if (jsonOutput.includes('\n')) {
                    // Multi-line output - try to extract JSON
                    const lines = jsonOutput.split('\n');
                    // Find first { and last }
                    const firstBrace = jsonOutput.indexOf('{');
                    const lastBrace = jsonOutput.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        jsonString = jsonOutput.substring(firstBrace, lastBrace + 1);
                    }
                }
                
                const result = JSON.parse(jsonString);
                
                console.log(`✅ Image analysis complete: ${result.title}`);
                resolve(result);
            } catch (error) {
                console.error(`❌ Failed to parse Python output: ${error.message}`);
                console.error(`Output: ${output}`);
                reject(new Error(`Failed to parse analysis result: ${error.message}`));
            }
        });
    });
}

module.exports = { analyzeImage };
