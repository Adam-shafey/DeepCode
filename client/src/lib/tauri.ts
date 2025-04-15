// This is a wrapper around Tauri API for better error handling and type safety

// Mock implementation for development, will be replaced by actual Tauri APIs in production
let isTauriAvailable = false;

// Check if Tauri API is available
try {
  // This would be '@tauri-apps/api' in a real Tauri app
  // For development, we'll check if window.__TAURI__ exists
  isTauriAvailable = !!(window as any).__TAURI__;
} catch (e) {
  console.warn("Tauri API not available, using mock implementation");
}

// Type for the event payload
export interface TauriEvent<T> {
  event: string;
  payload: T;
  windowLabel?: string;
}

// Type for the unlisten function
export type UnlistenFn = () => void;

// Invoke a Tauri command
export async function invoke<T>(command: string, args?: any): Promise<T> {
  if (isTauriAvailable) {
    try {
      // In a real Tauri app, this would use the actual invoke function
      // return await window.__TAURI__.invoke(command, args);
      
      // For now, we'll simulate API calls with fetch
      console.log(`Invoking Tauri command: ${command}`, args);
      
      // Map Tauri commands to API endpoints
      const apiMapping: Record<string, string> = {
        'open_folder': '/api/folder/open',
        'read_file': '/api/file',
        'get_file_tree': '/api/folder/tree',
        'learn_codebase': '/api/codebase/learn',
        'get_codebase_status': '/api/codebase/status',
        'chat': '/api/chat',
        'get_project_state': '/api/project',
        'save_api_keys': '/api/keys'
      };
      
      const endpoint = apiMapping[command];
      if (!endpoint) {
        throw new Error(`Unknown command: ${command}`);
      }
      
      // Convert Tauri commands to fetch API calls
      let response;
      if (command.startsWith('get_')) {
        // GET request
        const queryParams = args ? new URLSearchParams(args).toString() : '';
        response = await fetch(`${endpoint}${queryParams ? '?' + queryParams : ''}`);
      } else {
        // POST request
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(args)
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error invoking ${command}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error invoking Tauri command ${command}:`, error);
      throw error;
    }
  } else {
    // Mock implementation for development
    console.log(`[MOCK] Tauri command: ${command}`, args);
    
    // Simulate API delays
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock data based on the command
    switch (command) {
      case 'open_folder':
        return { path: '/mock/project/path', fileTree: mockFileTree } as unknown as T;
      case 'get_file_tree':
        return mockFileTree as unknown as T;
      case 'read_file':
        return { 
          path: args?.path || '/mock/file.js',
          content: '// This is a mock file content\nconsole.log("Hello world");\n',
          language: 'javascript'
        } as unknown as T;
      default:
        throw new Error(`Mock implementation not available for command: ${command}`);
    }
  }
}

// Listen for Tauri events
export async function listen<T>(
  event: string,
  handler: (event: TauriEvent<T>) => void
): Promise<UnlistenFn> {
  if (isTauriAvailable) {
    try {
      // In a real Tauri app, this would use the actual listen function
      // return await window.__TAURI__.event.listen(event, handler);
      
      // For now, we'll simulate event listening with a timeout
      console.log(`Listening for Tauri event: ${event}`);
      
      // We'll only need to implement a mock unlisten function
      return () => {
        console.log(`Unlistening from Tauri event: ${event}`);
      };
    } catch (error) {
      console.error(`Error setting up Tauri event listener for ${event}:`, error);
      throw error;
    }
  } else {
    // Mock implementation for development
    console.log(`[MOCK] Listening for Tauri event: ${event}`);
    
    // We'll simulate events with a timeout for certain event types
    if (event === 'codebase-status') {
      const intervalId = setInterval(() => {
        const mockStatuses = ['learning', 'learning', 'complete'];
        const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
        
        handler({
          event,
          payload: { status: randomStatus } as unknown as T
        });
        
        // If we reach 'complete', clear the interval
        if (randomStatus === 'complete') {
          clearInterval(intervalId);
        }
      }, 2000);
      
      // Return a function to clear the interval
      return () => {
        clearInterval(intervalId);
      };
    }
    
    // Default unlisten function
    return () => {
      console.log(`[MOCK] Unlistening from Tauri event: ${event}`);
    };
  }
}

// Mock file tree for development
const mockFileTree = {
  name: 'my-project',
  path: '/mock/project',
  isDirectory: true,
  children: [
    {
      name: 'src',
      path: '/mock/project/src',
      isDirectory: true,
      children: [
        {
          name: 'App.jsx',
          path: '/mock/project/src/App.jsx',
          isDirectory: false
        },
        {
          name: 'main.jsx',
          path: '/mock/project/src/main.jsx',
          isDirectory: false
        },
        {
          name: 'utils.js',
          path: '/mock/project/src/utils.js',
          isDirectory: false
        }
      ]
    },
    {
      name: 'package.json',
      path: '/mock/project/package.json',
      isDirectory: false
    },
    {
      name: 'README.md',
      path: '/mock/project/README.md',
      isDirectory: false
    }
  ]
};
