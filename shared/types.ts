// Shared types between frontend and backend

// API Key types
export interface ApiKeys {
  openai?: string;
  gemini?: string;
}

// Project state types
export interface ProjectState {
  projectPath?: string;
  apiKeys: ApiKeys;
  codebaseIndex?: CodebaseIndex;
  lastUpdated?: string;
}

export interface CodebaseIndex {
  summary: string;
  keyComponents: KeyComponent[];
  coreFunctionality: CoreFunctionality[];
  codeExplanations?: CodeExplanation[];
  dependencyAnalytics?: DependencyAnalysis;
}

export interface KeyComponent {
  name: string;
  path: string;
  description: string;
}

export interface CoreFunctionality {
  name: string;
  path: string;
  description: string;
}

// File system types
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

// Learning codebase status
export type CodebaseStatus = "idle" | "learning" | "complete" | "error";

export interface CodebaseStatusUpdate {
  status: CodebaseStatus;
  message?: string;
  progress?: number;
}

// Message types for AI chat
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// AI models
export type AIModel = "openai" | "gemini";

// Code file
export interface CodeFile {
  path: string;
  content: string;
  language?: string;
}
