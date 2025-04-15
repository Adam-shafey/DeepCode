import OpenAI from 'openai';
import type { ChatMessage, ProjectState, AIModel, CodeExplanation, DependencyAnalysis } from '../shared/types';
import fs from 'fs/promises';
import path from 'path';

// Generate AI response using OpenAI API
async function generateOpenAIResponse(
  message: string,
  conversation: ChatMessage[],
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });
  
  // Format conversation history for OpenAI
  const messages = [
    {
      role: "system",
      content: getSystemPrompt(projectState)
    },
    ...conversation.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: "user",
      content: message
    }
  ];
  
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any, // Type assertion to satisfy OpenAI API
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return `Error generating response: ${error.message || "Unknown error"}`;
  }
}

// Generate AI response using Gemini API (placeholder - would need proper Gemini API implementation)
async function generateGeminiResponse(
  message: string,
  conversation: ChatMessage[],
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  // This would be implemented with the Google Generative AI SDK
  // For MVP, we're using a simplified placeholder as the Gemini API integration
  // would follow a similar pattern to OpenAI but with Gemini-specific API calls
  
  console.warn("Gemini API implementation is a placeholder in this MVP");
  return "Gemini API integration is not fully implemented in this MVP. Please use OpenAI for now.";
}

// Generate AI response based on selected model
export async function generateAIResponse(
  message: string,
  conversation: ChatMessage[],
  model: AIModel,
  apiKey: string,
  projectState: ProjectState
): Promise<string> {
  if (model === "openai") {
    return generateOpenAIResponse(message, conversation, apiKey, projectState);
  } else if (model === "gemini") {
    return generateGeminiResponse(message, conversation, apiKey, projectState);
  } else {
    throw new Error(`Unsupported AI model: ${model}`);
  }
}

// Get OpenAI API key from project state
async function getOpenAIKey(): Promise<string> {
  const projectState = await global.storage?.getProjectState();
  
  if (!projectState?.apiKeys?.openai) {
    throw new Error("OpenAI API key not configured");
  }
  
  return projectState.apiKeys.openai;
}

// Comment code using AI
export async function commentCode(
  filePath: string, 
  content: string, 
  language: string
): Promise<{content: string}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are an expert programmer specializing in adding high-quality comments to code.
  
Your task is to add comprehensive comments to the provided ${language} code while maintaining the exact functionality.
  
Guidelines:
1. Add thorough documentation comments at the top of the file explaining its purpose
2. Add function/method level comments explaining purpose, parameters, and return values
3. Add inline comments for complex or non-obvious code sections
4. Format comments according to language standards (e.g., JSDoc for JavaScript/TypeScript)
5. DO NOT modify the actual code logic in any way
6. Make your comments professional, concise, and informative
7. Return ONLY the commented code and nothing else
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here's the ${language} code that needs comments:\n\n\`\`\`${language}\n${content}\n\`\`\``
        }
      ],
      temperature: 0.3, // Lower temperature for more deterministic output
      max_tokens: 4000,
    });
    
    // Extract code from response
    const commentedCode = response.choices[0].message.content || "";
    
    // Clean up any markdown code block formatting that may be in the response
    const codeRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = commentedCode.match(codeRegex);
    const cleanedCode = match ? match[1] : commentedCode;
    
    // Save the result back to the file
    await fs.writeFile(filePath, cleanedCode, 'utf8');
    
    return { content: cleanedCode };
  } catch (error: any) {
    console.error("Error commenting code:", error);
    throw new Error(`Failed to comment code: ${error.message}`);
  }
}

// Detect bugs in code using AI
export async function detectBugs(
  filePath: string, 
  content: string, 
  language: string
): Promise<{issues: {line: number, description: string, severity: string}[], summary: string}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are a code quality expert specializing in bug detection.
  
Your task is to analyze the provided ${language} code and identify potential bugs, errors, or code quality issues.

You should return your analysis as a JSON object with the following structure:
{
  "issues": [
    {
      "line": <line number>,
      "description": <clear description of the issue>,
      "severity": <"critical", "high", "medium", or "low">
    },
    ...
  ],
  "summary": <brief overall assessment of the code quality>
}

Focus on:
1. Logic errors or bugs
2. Performance issues
3. Security vulnerabilities
4. Error handling problems
5. Memory leaks or resource management issues
6. Code style or maintainability concerns

Be thorough but focus on genuine issues. If the code is high quality, it's okay to have fewer issues.
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here's the ${language} code to analyze:\n\n\`\`\`${language}\n${content}\n\`\`\``
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });
    
    const analysisText = response.choices[0].message.content || "";
    const analysis = JSON.parse(analysisText);
    
    return analysis;
  } catch (error: any) {
    console.error("Error detecting bugs:", error);
    throw new Error(`Failed to detect bugs: ${error.message}`);
  }
}

// Optimize code using AI
export async function optimizeCode(
  filePath: string, 
  content: string, 
  language: string
): Promise<{content: string, improvements: string}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are an expert programmer specializing in code optimization.
  
Your task is to optimize the provided ${language} code while preserving its exact functionality.

You should return a JSON object with:
{
  "optimizedCode": <the optimized code>,
  "improvements": <bullet list of improvements made>
}

Focus on:
1. Performance improvements
2. Reducing code complexity
3. Better algorithms or data structures
4. Modern language features
5. Readability and maintainability
6. Removing redundancies

Ensure the functionality remains identical.
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here's the ${language} code to optimize:\n\n\`\`\`${language}\n${content}\n\`\`\``
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    
    const optimizationText = response.choices[0].message.content || "";
    const optimization = JSON.parse(optimizationText);
    
    // Save the result back to the file
    await fs.writeFile(filePath, optimization.optimizedCode, 'utf8');
    
    return { 
      content: optimization.optimizedCode, 
      improvements: optimization.improvements 
    };
  } catch (error: any) {
    console.error("Error optimizing code:", error);
    throw new Error(`Failed to optimize code: ${error.message}`);
  }
}

// Generate test cases for code using AI
export async function generateTests(
  filePath: string, 
  content: string, 
  language: string
): Promise<{testCode: string}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are an expert programmer specializing in test-driven development.
  
Your task is to create comprehensive test cases for the provided ${language} code.

Generate appropriate tests using the popular testing frameworks for ${language}:
- JavaScript/TypeScript: Jest or Mocha
- Python: pytest or unittest
- Java: JUnit
- C#: NUnit or MSTest
- Go: built-in testing package
- Ruby: RSpec
- Rust: built-in testing module

Follow these guidelines:
1. Include both unit tests and integration tests where appropriate
2. Cover edge cases and error scenarios
3. Use mocks/stubs for external dependencies
4. Aim for high test coverage
5. Use descriptive test names that explain the intention
6. Organize tests logically
7. Include setup/teardown as needed

Return ONLY the test code, properly formatted for the language.
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here's the ${language} code to generate tests for:\n\n\`\`\`${language}\n${content}\n\`\`\``
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
    });
    
    const testCode = response.choices[0].message.content || "";
    
    // Clean up any markdown code block formatting
    const codeRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = testCode.match(codeRegex);
    const cleanedTestCode = match ? match[1] : testCode;
    
    return { testCode: cleanedTestCode };
  } catch (error: any) {
    console.error("Error generating tests:", error);
    throw new Error(`Failed to generate tests: ${error.message}`);
  }
}

// Generate a plain language explanation of code for non-technical stakeholders
export async function explainCodeForProductManagers(
  filePath: string,
  content: string,
  language: string
): Promise<{
  explanation: string;
  complexity: 'simple' | 'moderate' | 'complex';
  businessImpact: 'low' | 'medium' | 'high';
  concepts: string[];
}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are an expert at explaining technical code to non-technical stakeholders like product managers. 
  
Your task is to explain the provided ${language} code in plain, non-technical language.

Follow these guidelines:
1. Explain what the code does in business terms without technical jargon
2. Highlight the core purpose and functionality
3. Indicate how this code relates to user features or experiences
4. Identify any business logic or rules implemented
5. Suggest potential implications for product decisions
6. Rate the complexity from a product perspective
7. Estimate the business impact of this code

Return a JSON object with the following structure:
{
  "explanation": "Plain language explanation of the code's purpose and functionality",
  "complexity": "simple, moderate, or complex",
  "businessImpact": "low, medium, or high",
  "concepts": ["List", "of", "key", "concepts", "in", "the", "code"]
}
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here's the ${language} code to explain:\n\n\`\`\`${language}\n${content}\n\`\`\``
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });
    
    const explanation = JSON.parse(response.choices[0].message.content || "{}");
    
    // Save this explanation to the codebase index
    const codeExplanation: CodeExplanation = {
      path: filePath,
      explanation: explanation.explanation,
      timestamp: new Date().toISOString(),
      complexity: explanation.complexity,
      businessImpact: explanation.businessImpact,
      concepts: explanation.concepts,
    };
    
    await updateCodebaseWithExplanation(codeExplanation);
    
    return explanation;
  } catch (error: any) {
    console.error("Error explaining code:", error);
    throw new Error(`Failed to explain code: ${error.message}`);
  }
}

// Analyze dependencies within a codebase
export async function analyzeDependencies(
  projectPath: string
): Promise<{
  projectDependencies: {
    name: string;
    version: string;
    description: string;
    usageLocations: string[];
    alternatives?: string[];
    securityIssues?: string[];
    isOutdated?: boolean;
  }[];
  internalDependencies: {
    sourcePath: string;
    targetPath: string;
    type: 'import' | 'reference' | 'inheritance' | 'implementation';
    importance: 'low' | 'medium' | 'high';
  }[];
  summary: string;
}> {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({ apiKey });
  
  try {
    // 1. Analyze package.json, requirements.txt, or other dependency files
    let dependencyFiles: {path: string, content: string}[] = [];
    let fileList: string[] = [];
    
    try {
      // Read package.json if it exists
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      dependencyFiles.push({
        path: 'package.json',
        content: packageJsonContent
      });
      
      // Add additional dependency files based on project type
      // e.g., requirements.txt for Python, Cargo.toml for Rust, etc.
    } catch (err) {
      console.log("No package.json found, skipping package analysis");
    }
    
    // 2. Scan for import statements in source files
    // Get a list of source files
    const getSourceFiles = async (dir: string, fileList: string[] = []): Promise<string[]> => {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          fileList = await getSourceFiles(filePath, fileList);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java'].includes(ext)) {
            fileList.push(filePath);
          }
        }
      }
      
      return fileList;
    };
    
    try {
      fileList = await getSourceFiles(projectPath);
    } catch (err) {
      console.error("Error scanning source files:", err);
    }
    
    // 3. Extract a sample of import statements from files
    const importSamples: string[] = [];
    const maxSamples = 50;
    
    for (const filePath of fileList.slice(0, maxSamples)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(projectPath, filePath);
        
        // Simple regex to find import statements (would need to be adjusted for different languages)
        const jsImportRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
        const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
        
        let match;
        const imports: string[] = [];
        
        while ((match = jsImportRegex.exec(content)) !== null) {
          imports.push(match[0]);
        }
        
        while ((match = requireRegex.exec(content)) !== null) {
          imports.push(match[0]);
        }
        
        if (imports.length > 0) {
          importSamples.push(`File: ${relativePath}\nImports:\n${imports.join('\n')}`);
        }
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }
    
    // 4. Send to OpenAI for analysis
    const systemPrompt = `You are an expert in dependency analysis and software architecture. 
    
Your task is to analyze project dependencies and internal code dependencies to provide insights for product managers.

Based on the provided dependency files and import statements, create a comprehensive analysis that helps product managers understand:
1. External library dependencies and their purposes
2. Internal code dependencies and relationships
3. Potential security issues, technical debt, or optimization opportunities
4. Business-relevant insights about the codebase structure

Return a JSON object with the following structure:
{
  "projectDependencies": [
    {
      "name": "dependency-name",
      "version": "version",
      "description": "What this dependency does in business terms",
      "usageLocations": ["paths/to/files/using/it"],
      "alternatives": ["alternative-library-1", "alternative-library-2"],
      "securityIssues": ["description of any security concerns"],
      "isOutdated": true/false
    }
  ],
  "internalDependencies": [
    {
      "sourcePath": "path/to/source/file",
      "targetPath": "path/to/imported/file",
      "type": "import/reference/inheritance/implementation",
      "importance": "low/medium/high"
    }
  ],
  "summary": "Overall assessment of the project dependencies and structure from a product perspective"
}`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `
Project Path: ${projectPath}

Dependency Files:
${dependencyFiles.map(file => `*** ${file.path} ***\n${file.content}`).join('\n\n')}

Import Samples:
${importSamples.join('\n\n')}

Please analyze these dependencies and provide insights for product managers.
          `
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    // 5. Save the analysis to the codebase index
    await updateCodebaseWithDependencyAnalysis({
      timestamp: new Date().toISOString(),
      projectDependencies: analysis.projectDependencies,
      internalDependencies: analysis.internalDependencies,
      summary: analysis.summary
    });
    
    return analysis;
  } catch (error: any) {
    console.error("Error analyzing dependencies:", error);
    throw new Error(`Failed to analyze dependencies: ${error.message}`);
  }
}

// Helper function to update the codebase index with a code explanation
async function updateCodebaseWithExplanation(explanation: CodeExplanation): Promise<void> {
  try {
    const projectState = await global.storage?.getProjectState();
    
    if (!projectState || !projectState.codebaseIndex) {
      console.error("No codebase index available to update");
      return;
    }
    
    // Add this explanation to the codebase index
    if (!projectState.codebaseIndex.codeExplanations) {
      projectState.codebaseIndex.codeExplanations = [];
    }
    
    // Check if an explanation for this file already exists
    const existingIndex = projectState.codebaseIndex.codeExplanations.findIndex(
      exp => exp.path === explanation.path
    );
    
    if (existingIndex >= 0) {
      // Update existing explanation
      projectState.codebaseIndex.codeExplanations[existingIndex] = explanation;
    } else {
      // Add new explanation
      projectState.codebaseIndex.codeExplanations.push(explanation);
    }
    
    // Save updated project state
    await global.storage?.saveProjectState(projectState);
    
  } catch (error) {
    console.error("Error updating codebase with explanation:", error);
  }
}

// Helper function to update the codebase index with dependency analysis
async function updateCodebaseWithDependencyAnalysis(analysis: DependencyAnalysis): Promise<void> {
  try {
    const projectState = await global.storage?.getProjectState();
    
    if (!projectState || !projectState.codebaseIndex) {
      console.error("No codebase index available to update");
      return;
    }
    
    // Add the dependency analysis to the codebase index
    projectState.codebaseIndex.dependencyAnalytics = analysis;
    
    // Save updated project state
    await global.storage?.saveProjectState(projectState);
    
  } catch (error) {
    console.error("Error updating codebase with dependency analysis:", error);
  }
}

// Create system prompt for the AI based on project context
function getSystemPrompt(projectState: ProjectState): string {
  let systemPrompt = "You are an AI coding assistant for the DeepDe :code application. ";
  
  if (projectState.projectPath) {
    systemPrompt += `You are currently helping with a project located at ${projectState.projectPath}. `;
  }
  
  if (projectState.codebaseIndex) {
    systemPrompt += "You have the following information about the codebase: \n\n";
    systemPrompt += `${projectState.codebaseIndex.summary}\n\n`;
    
    systemPrompt += "Key Components:\n";
    projectState.codebaseIndex.keyComponents.forEach(comp => {
      systemPrompt += `- ${comp.name} (${comp.path}): ${comp.description}\n`;
    });
    
    systemPrompt += "\nCore Functionality:\n";
    projectState.codebaseIndex.coreFunctionality.forEach(func => {
      systemPrompt += `- ${func.name} (${func.path}): ${func.description}\n`;
    });
  } else {
    systemPrompt += "The user hasn't analyzed their codebase yet. ";
  }
  
  systemPrompt += "\nProvide clear, accurate coding advice. When asked about code, explain its purpose and potential improvements. If you're uncertain, acknowledge it rather than guessing.";
  
  return systemPrompt;
}
