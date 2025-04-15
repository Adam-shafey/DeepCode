import { useState, useEffect, useCallback } from 'react';
import { invoke, listen, UnlistenFn } from '@/lib/tauri';

// Generic hook for Tauri IPC communication
export function useIPC<T, R>(
  command: string,
  args?: T,
  listenTo?: string
): {
  data: R | null;
  loading: boolean;
  error: Error | null;
  invoke: (newArgs?: T) => Promise<void>;
} {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to invoke the command
  const invokeCommand = useCallback(async (newArgs?: T) => {
    setLoading(true);
    setError(null);
    
    try {
      const argsToUse = newArgs || args;
      const result = await invoke<R>(command, argsToUse);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [command, args]);
  
  // Set up event listener if listenTo is provided
  useEffect(() => {
    if (!listenTo) return;
    
    let unlistenFn: UnlistenFn;
    
    const setupListener = async () => {
      try {
        unlistenFn = await listen<R>(listenTo, (event) => {
          if (event.payload) {
            setData(event.payload as R);
          }
        });
      } catch (err) {
        console.error(`Error setting up listener for ${listenTo}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    setupListener();
    
    // Clean up the listener when the component unmounts
    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [listenTo]);
  
  // Invoke the command on mount if args are provided
  useEffect(() => {
    if (args) {
      invokeCommand();
    }
  }, []); // Intentionally empty dependency array for on-mount invocation
  
  return {
    data,
    loading,
    error,
    invoke: invokeCommand
  };
}
