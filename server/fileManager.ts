import fs from 'fs/promises';
import path from 'path';
import type { FileEntry } from '../shared/types';

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

// Open folder dialog
export async function openFolderDialog(): Promise<string | null> {
  try {
    // For development environment, simulate a folder path
    if (!isTauri) {
      // Return a mock path for development
      return '/sample/project/path';
    } else {
      // In Tauri environment, we would use the Tauri dialog API
      // This code will be used when running in the Tauri app
      // const { open } = await import('@tauri-apps/api/dialog');
      // const selected = await open({
      //   directory: true,
      //   multiple: false,
      //   title: 'Select Project Folder'
      // });
      // 
      // if (selected === null) {
      //   return null; // User canceled
      // }
      // 
      // return Array.isArray(selected) ? selected[0] : selected;
      
      // For now, return a mock path
      return '/sample/project/path';
    }
  } catch (error) {
    console.error('Error opening folder dialog:', error);
    throw new Error('Failed to open folder dialog');
  }
}

// Read file content using fs module
export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

// Get file tree recursively
export async function getFileTree(dirPath: string): Promise<FileEntry> {
  try {
    const stats = await fs.stat(dirPath);
    
    const name = path.basename(dirPath);
    const entry: FileEntry = {
      name,
      path: dirPath,
      isDirectory: stats.isDirectory(),
      children: []
    };
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(dirPath);
      
      // Process each file/directory
      const children = await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(dirPath, file);
          
          try {
            // Skip hidden files and node_modules to avoid excessive processing
            if (file.startsWith('.') || file === 'node_modules' || file === '.git') {
              return null;
            }
            
            return await getFileTree(fullPath);
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null entries (skipped or errored items)
      entry.children = children.filter(Boolean) as FileEntry[];
    }
    
    return entry;
  } catch (error) {
    console.error(`Error getting file tree for ${dirPath}:`, error);
    throw new Error(`Failed to get file tree for: ${dirPath}`);
  }
}
