import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { invoke } from "@/lib/tauri";
import SettingsModal from "@/components/SettingsModal";
import type { ApiKeys } from "../../shared/types";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [apiKeysChecked, setApiKeysChecked] = useState(false);

  // Check if API keys are set on startup
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const response = await fetch('/api/project');
        if (response.ok) {
          const data = await response.json();
          setApiKeys(data.apiKeys || {});
          
          // Show settings modal on first run if no API keys are set
          if (!data.apiKeys?.openai && !data.apiKeys?.gemini) {
            setShowSettings(true);
            toast({
              title: "Welcome to DeepCode",
              description: "Please configure your API keys to get started.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load project settings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking API keys:", error);
        toast({
          title: "Error",
          description: "Failed to load project settings.",
          variant: "destructive"
        });
      } finally {
        setApiKeysChecked(true);
      }
    };

    checkApiKeys();
  }, []);

  const handleSaveApiKeys = async (keys: ApiKeys) => {
    try {
      // Save the API keys
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(keys)
      });

      if (response.ok) {
        setApiKeys(keys);
        setShowSettings(false);
        
        toast({
          title: "Success",
          description: "API keys saved successfully.",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }
    } catch (error: any) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save API keys",
        variant: "destructive"
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {/* Only render the main app after API key check is complete */}
      {apiKeysChecked && (
        <>
          <Router />
          <SettingsModal 
            open={showSettings} 
            onOpenChange={setShowSettings} 
            apiKeys={apiKeys}
            onSave={handleSaveApiKeys}
          />
        </>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
