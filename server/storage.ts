import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ProjectState, ApiKeys, CodebaseIndex } from '../shared/types';

// Get the directory where the app is running
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the storage location
const STORAGE_DIR = path.join(__dirname, '..', '.deepcode');
const PROJECT_STATE_FILE = path.join(STORAGE_DIR, 'project.json');

// Create interface for storage operations
export interface IStorage {
  saveProjectState(state: ProjectState): Promise<void>;
  getProjectState(): Promise<ProjectState | null>;
  updateCodebaseIndex(index: CodebaseIndex): Promise<void>;
}

// Implement storage for DeepCode app
export class FileStorage implements IStorage {
  
  // Save project state to file
  async saveProjectState(state: ProjectState): Promise<void> {
    try {
      // Make sure the storage directory exists
      await this.ensureStorageDirectory();
      
      // Save the state with current timestamp
      const stateToSave: ProjectState = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(
        PROJECT_STATE_FILE, 
        JSON.stringify(stateToSave, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving project state:', error);
      throw new Error('Failed to save project state');
    }
  }
  
  // Get the current project state
  async getProjectState(): Promise<ProjectState | null> {
    try {
      // Check if the project state file exists
      await this.ensureStorageDirectory();
      
      try {
        await fs.access(PROJECT_STATE_FILE);
      } catch {
        // File doesn't exist yet, return null
        return null;
      }
      
      // Read and parse the project state
      const rawData = await fs.readFile(PROJECT_STATE_FILE, 'utf-8');
      return JSON.parse(rawData) as ProjectState;
    } catch (error) {
      console.error('Error getting project state:', error);
      return null;
    }
  }
  
  // Update the codebase index in the project state
  async updateCodebaseIndex(index: CodebaseIndex): Promise<void> {
    try {
      const state = await this.getProjectState() || { apiKeys: {} };
      
      // Update the index
      state.codebaseIndex = index;
      
      // Save the updated state
      await this.saveProjectState(state);
    } catch (error) {
      console.error('Error updating codebase index:', error);
      throw new Error('Failed to update codebase index');
    }
  }
  
  // Helper to ensure the storage directory exists
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(STORAGE_DIR);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
  }
}

// Export a singleton instance of the storage
export const storage = new FileStorage();
