import { Worker, parentPort, isMainThread, workerData } from 'worker_threads';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { storage } from './storage';
import { generateAIResponse } from './ai';
import { getFileTree } from './fileManager';
import type { ApiKeys, CodebaseIndex, CodebaseStatusUpdate, ChatMessage } from '../shared/types';

// Global status tracking
global.codebaseStatus = { status: "idle" };

// Update the global codebase status
function updateCodebaseStatus(status: CodebaseStatusUpdate): void {
  global.codebaseStatus = status;
  console.log(`Codebase status: ${status.status}${status.message ? ` - ${status.message}` : ''}`);
}

// Main function to learn the codebase
export function learnCodebase(projectPath: string, apiKeys: ApiKeys): void {
  // Update status to learning
  updateCodebaseStatus({ status: "learning", message: "Starting codebase analysis" });
  
  // Create worker thread for non-blocking operation
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const workerPath = path.join(__dirname, 'worker.ts');
  
  // Pass the project path and API keys to the worker
  const worker = new Worker(__filename, {
    workerData: { projectPath, apiKeys }
  });
  
  // Listen for messages from the worker
  worker.on('message', (message: { type: string; data: any }) => {
    if (message.type === 'status') {
      updateCodebaseStatus(message.data);
    } else if (message.type === 'complete') {
      // Store the codebase index in the project state
      storage.updateCodebaseIndex(message.data)
        .then(() => {
          updateCodebaseStatus({ status: "complete", message: "Codebase analysis complete" });
        })
        .catch(error => {
          console.error("Error storing codebase index:", error);
          updateCodebaseStatus({ 
            status: "error", 
            message: "Failed to store codebase index: " + error.message 
          });
        });
    }
  });
  
  // Handle worker errors
  worker.on('error', (error) => {
    console.error("Worker error:", error);
    updateCodebaseStatus({ status: "error", message: error.message });
  });
  
  // Handle worker exit
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
      updateCodebaseStatus({ 
        status: "error", 
        message: `Worker process exited with code ${code}`
      });
    }
  });
}

// Worker thread code
if (!isMainThread) {
  const { projectPath, apiKeys } = workerData;
  
  // Function to report status to main thread
  function reportStatus(status: CodebaseStatusUpdate) {
    if (parentPort) {
      parentPort.postMessage({ type: 'status', data: status });
    }
  }
  
  // Function to analyze codebase and return index
  async function analyzeCodebase(): Promise<void> {
    try {
      reportStatus({ 
        status: "learning", 
        message: "Gathering file information",
        progress: 10
      });
      
      // Get the file tree
      const fileTree = await getFileTree(projectPath);
      
      // Extract information about files for the prompt
      reportStatus({ 
        status: "learning", 
        message: "Analyzing project structure",
        progress: 30
      });
      
      // Collect information about key files
      const fileInfos: string[] = [];
      const maxFiles = 20; // Limit to avoid overloading the prompt
      let collectedFiles = 0;
      
      // Helper function to traverse file tree
      async function collectFileInfo(entry: any, depth = 0): Promise<void> {
        if (collectedFiles >= maxFiles) return;
        
        if (!entry.isDirectory) {
          // Check if file is a source code file worth analyzing
          const ext = path.extname(entry.name).toLowerCase();
          const sourceExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.rb', '.php'];
          
          if (sourceExts.includes(ext)) {
            try {
              const filePath = entry.path;
              const relativePath = path.relative(projectPath, filePath);
              
              // Read file content
              const content = await fs.readFile(filePath, 'utf-8');
              
              // Take first 1000 characters to get a sense of the file
              const preview = content.substring(0, 1000);
              
              fileInfos.push(`File: ${relativePath}\nPreview:\n${preview}\n---`);
              collectedFiles++;
            } catch (error) {
              console.error(`Error reading file ${entry.path}:`, error);
            }
          }
        } else if (depth < 3) { // Limit depth to avoid too deep recursion
          // Process children for directories
          if (entry.children) {
            for (const child of entry.children) {
              await collectFileInfo(child, depth + 1);
              if (collectedFiles >= maxFiles) break;
            }
          }
        }
      }
      
      // Start collecting file info from the root
      if (fileTree && fileTree.children) {
        for (const entry of fileTree.children) {
          await collectFileInfo(entry);
          if (collectedFiles >= maxFiles) break;
        }
      }
      
      reportStatus({ 
        status: "learning", 
        message: "Generating codebase summary",
        progress: 60
      });
      
      // Build prompt for AI analysis
      const message = `Analyze this codebase located at ${projectPath}. Create a summary of its purpose, architecture, and key components. Identify main files/modules and their functionality.

Here are some key files from the project:
${fileInfos.join('\n\n')}

Generate a JSON response with the following structure:
{
  "summary": "Overall description of the codebase",
  "keyComponents": [
    {"name": "ComponentName", "path": "relative/path", "description": "What this component does"}
  ],
  "coreFunctionality": [
    {"name": "FunctionalityName", "path": "relative/path", "description": "What this functionality does"}
  ]
}`;

      // Select the API model to use (prefer OpenAI if available)
      const model = apiKeys.openai ? "openai" : "gemini";
      const apiKey = model === "openai" ? apiKeys.openai : apiKeys.gemini;
      
      if (!apiKey) {
        throw new Error("No API keys configured");
      }
      
      reportStatus({ 
        status: "learning", 
        message: "Querying AI for codebase analysis",
        progress: 80
      });
      
      // Generate AI analysis
      const systemMessage: ChatMessage = {
        role: "system",
        content: "You are analyzing a codebase. Provide a JSON response with summary, key components, and core functionality.",
        timestamp: new Date().toISOString()
      };
      
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };
      
      const aiResponse = await generateAIResponse(
        message, 
        [systemMessage], 
        model as any, 
        apiKey as string,
        { apiKeys, projectPath }
      );
      
      // Parse the JSON response, extracting it from any surrounding text if needed
      let jsonResponse: CodebaseIndex;
      try {
        // Look for JSON content in the response
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         aiResponse.match(/```\n([\s\S]*?)\n```/) || 
                         aiResponse.match(/{[\s\S]*?}/);
        
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        jsonResponse = JSON.parse(jsonString);
        
        // Validate the structure
        if (!jsonResponse.summary || !Array.isArray(jsonResponse.keyComponents) || !Array.isArray(jsonResponse.coreFunctionality)) {
          throw new Error("Invalid response structure");
        }
      } catch (error) {
        console.error("Error parsing AI response:", error);
        console.log("Raw AI response:", aiResponse);
        
        // Create a fallback response
        jsonResponse = {
          summary: "Analysis could not be completed. The AI provided an invalid response format.",
          keyComponents: [],
          coreFunctionality: []
        };
      }
      
      reportStatus({ 
        status: "learning", 
        message: "Completing codebase analysis",
        progress: 95
      });
      
      // Send the completed index back to the main thread
      if (parentPort) {
        parentPort.postMessage({ type: 'complete', data: jsonResponse });
      }
      
    } catch (error: any) {
      console.error("Error in worker thread:", error);
      reportStatus({ 
        status: "error", 
        message: error.message || "Unknown error"
      });
    }
  }
  
  // Start analysis
  analyzeCodebase().catch(error => {
    console.error("Uncaught error in worker:", error);
    reportStatus({ 
      status: "error", 
      message: error.message || "Unknown error"
    });
  });
}
