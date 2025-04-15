import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date string to a readable format
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

// Truncate a string to a given length
export function truncate(str: string, length: number) {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + '...';
}

// Get file extension from path
export function getFileExtension(path: string) {
  return path.split('.').pop()?.toLowerCase();
}

// Map file extension to a language for code highlighting
export function mapExtensionToLanguage(extension?: string) {
  if (!extension) return 'text';
  
  const languageMap: Record<string, string> = {
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
  
  return languageMap[extension] || 'text';
}

// Deep compare two objects
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a === null || b === null || 
      typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    return deepEqual(a[key], b[key]);
  });
}
