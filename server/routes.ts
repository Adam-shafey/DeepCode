import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Worker } from "worker_threads";
import path from "path";
import { learnCodebase } from "./worker";
import { generateAIResponse, commentCode, detectBugs, optimizeCode, generateTests, explainCodeForProductManagers, analyzeDependencies } from "./ai";
import { openFolderDialog, readFileContent, getFileTree } from "./fileManager";
import type { ChatMessage, CodebaseStatusUpdate, ProjectState, ApiKeys, FileEntry, CodeFile } from "../shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API routes
  
  // Get project state
  app.get("/api/project", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      res.json(projectState || { apiKeys: {} });
    } catch (error) {
      console.error("Error getting project state:", error);
      res.status(500).json({ error: "Failed to get project state" });
    }
  });

  // Save API keys
  app.post("/api/keys", async (req, res) => {
    try {
      const { openai, gemini } = req.body as ApiKeys;
      const projectState = await storage.getProjectState() || { apiKeys: {} };

      projectState.apiKeys = {
        ...projectState.apiKeys,
        ...(openai && { openai }),
        ...(gemini && { gemini }),
      };

      await storage.saveProjectState(projectState);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving API keys:", error);
      res.status(500).json({ error: "Failed to save API keys" });
    }
  });

  // Open folder dialog
  app.post("/api/folder/open", async (req, res) => {
    try {
      const folderPath = await openFolderDialog();
      if (!folderPath) {
        return res.json({ canceled: true });
      }

      // Update project state with the new folder path
      const projectState = await storage.getProjectState() || { apiKeys: {} };
      projectState.projectPath = folderPath;
      await storage.saveProjectState(projectState);

      // Get file tree
      const fileTree = await getFileTree(folderPath);

      res.json({ path: folderPath, fileTree });
    } catch (error) {
      console.error("Error opening folder dialog:", error);
      res.status(500).json({ error: "Failed to open folder dialog" });
    }
  });

  // Get file tree
  app.get("/api/folder/tree", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      if (!projectState?.projectPath) {
        return res.status(400).json({ error: "No project folder selected" });
      }

      const fileTree = await getFileTree(projectState.projectPath);
      res.json(fileTree);
    } catch (error) {
      console.error("Error getting file tree:", error);
      res.status(500).json({ error: "Failed to get file tree" });
    }
  });

  // Get file content
  app.get("/api/file", async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: "No file path provided" });
      }

      const content = await readFileContent(filePath);
      
      // Determine language from file extension
      const extension = path.extname(filePath).substring(1);
      let language = 'text';
      
      // Map common extensions to languages
      const extensionMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        rs: 'rust',
        go: 'go',
        java: 'java',
        kt: 'kotlin',
        rb: 'ruby',
        php: 'php',
        c: 'c',
        cpp: 'cpp',
        cs: 'csharp',
        sh: 'shell',
      };
      
      if (extension in extensionMap) {
        language = extensionMap[extension];
      }
      
      const file: CodeFile = {
        path: filePath,
        content,
        language,
      };

      res.json(file);
    } catch (error) {
      console.error("Error reading file:", error);
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  // Start learning codebase
  app.post("/api/codebase/learn", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      if (!projectState?.projectPath) {
        return res.status(400).json({ error: "No project folder selected" });
      }

      if (!projectState.apiKeys.openai && !projectState.apiKeys.gemini) {
        return res.status(400).json({ error: "No API keys configured" });
      }

      // Start the worker in a separate thread
      learnCodebase(projectState.projectPath, projectState.apiKeys);
      
      // Immediately return success to indicate the process has started
      res.json({ success: true });
    } catch (error) {
      console.error("Error learning codebase:", error);
      res.status(500).json({ error: "Failed to learn codebase" });
    }
  });

  // Get codebase status
  app.get("/api/codebase/status", (req, res) => {
    try {
      // Get the current status from the worker
      // This endpoint can be polled by the frontend to get updates
      const status = global.codebaseStatus || { status: "idle" };
      res.json(status);
    } catch (error) {
      console.error("Error getting codebase status:", error);
      res.status(500).json({ error: "Failed to get codebase status" });
    }
  });

  // AI chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversation } = req.body;
      const projectState = await storage.getProjectState();
      
      if (!projectState?.apiKeys?.openai && !projectState?.apiKeys?.gemini) {
        return res.status(400).json({ error: "No API keys configured" });
      }

      // Select the API key to use (prefer OpenAI if both are available)
      const model = projectState.apiKeys.openai ? "openai" : "gemini";
      const apiKey = model === "openai" ? projectState.apiKeys.openai : projectState.apiKeys.gemini;

      // Generate AI response
      const responseText = await generateAIResponse(message, conversation, model, apiKey as string, projectState);
      
      const newMessage: ChatMessage = {
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      res.json(newMessage);
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // AI Code Enhancement Routes

  // Comment code
  app.post("/api/ai/comment-code", async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const result = await commentCode(filePath, content, language || 'text');
      res.json(result);
    } catch (error: any) {
      console.error("Error commenting code:", error);
      res.status(500).json({ error: error.message || "Failed to comment code" });
    }
  });

  // Detect bugs in code
  app.post("/api/ai/detect-bugs", async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const result = await detectBugs(filePath, content, language || 'text');
      res.json(result);
    } catch (error: any) {
      console.error("Error detecting bugs:", error);
      res.status(500).json({ error: error.message || "Failed to detect bugs" });
    }
  });

  // Optimize code
  app.post("/api/ai/optimize-code", async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const result = await optimizeCode(filePath, content, language || 'text');
      res.json(result);
    } catch (error: any) {
      console.error("Error optimizing code:", error);
      res.status(500).json({ error: error.message || "Failed to optimize code" });
    }
  });

  // Generate test cases
  app.post("/api/ai/generate-tests", async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const result = await generateTests(filePath, content, language || 'text');
      res.json(result);
    } catch (error: any) {
      console.error("Error generating tests:", error);
      res.status(500).json({ error: error.message || "Failed to generate tests" });
    }
  });

  // Explain code for product managers
  app.post("/api/ai/explain-code", async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ error: "File path and content are required" });
      }

      const result = await explainCodeForProductManagers(filePath, content, language || 'text');
      res.json(result);
    } catch (error: any) {
      console.error("Error explaining code:", error);
      res.status(500).json({ error: error.message || "Failed to explain code" });
    }
  });

  // Analyze project dependencies
  app.post("/api/ai/analyze-dependencies", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      
      if (!projectState?.projectPath) {
        return res.status(400).json({ error: "No project folder selected" });
      }

      const result = await analyzeDependencies(projectState.projectPath);
      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing dependencies:", error);
      res.status(500).json({ error: error.message || "Failed to analyze dependencies" });
    }
  });

  // Get code explanations from codebase index
  app.get("/api/codebase/explanations", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      
      if (!projectState?.codebaseIndex?.codeExplanations) {
        return res.json({ explanations: [] });
      }

      res.json({ explanations: projectState.codebaseIndex.codeExplanations });
    } catch (error: any) {
      console.error("Error getting code explanations:", error);
      res.status(500).json({ error: error.message || "Failed to get code explanations" });
    }
  });

  // Get dependency analytics from codebase index
  app.get("/api/codebase/dependencies", async (req, res) => {
    try {
      const projectState = await storage.getProjectState();
      
      if (!projectState?.codebaseIndex?.dependencyAnalytics) {
        return res.json({ dependencies: null });
      }

      res.json({ dependencies: projectState.codebaseIndex.dependencyAnalytics });
    } catch (error: any) {
      console.error("Error getting dependency analytics:", error);
      res.status(500).json({ error: error.message || "Failed to get dependency analytics" });
    }
  });

  return httpServer;
}

// Global declaration for TypeScript
declare global {
  var codebaseStatus: CodebaseStatusUpdate;
}
