import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SettingsModal from '@/components/SettingsModal';
import { useToast } from '@/hooks/use-toast';
import type { ApiKeys } from '../../../shared/types';

export default function Home() {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load project state on mount
  useEffect(() => {
    const loadProjectState = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/project');
        
        if (response.ok) {
          const data = await response.json();
          setApiKeys(data.apiKeys || {});
        } else {
          throw new Error('Failed to load project state');
        }
      } catch (error) {
        console.error('Error loading project state:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project state. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectState();
  }, []);

  // Handle saving API keys
  const handleSaveApiKeys = async (keys: ApiKeys) => {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keys),
      });

      if (response.ok) {
        setApiKeys(keys);
        setShowSettings(false);
        
        toast({
          title: 'Success',
          description: 'API keys saved successfully.',
          variant: 'default',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API keys');
      }
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to save API keys',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4 text-muted-foreground">Loading DeepCode...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout 
        apiKeys={apiKeys}
        onOpenSettings={() => setShowSettings(true)}
      />
      
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        apiKeys={apiKeys}
        onSave={handleSaveApiKeys}
      />
    </>
  );
}
