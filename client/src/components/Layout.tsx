import { ReactNode, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import LeftSidebar from './LeftSidebar';
import CodeView from './CodeView';
import AIChat from './AIChat';
import { useToast } from '@/hooks/use-toast';
import SettingsModal from './SettingsModal';
import { Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApiKeys, CodeFile, FileEntry, ChatMessage } from '../../../shared/types';

interface LayoutProps {
  children?: ReactNode;
  apiKeys: ApiKeys;
  onOpenSettings: () => void;
}

export default function Layout({ 
  children, 
  apiKeys,
  onOpenSettings 
}: LayoutProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry | null>(null);
  const [codebaseStatus, setCodebaseStatus] = useState<string>("idle");
  const [conversation, setConversation] = useState<ChatMessage[]>([{
    role: "system",
    content: "Hello! I'm your AI coding assistant. I can help you understand your codebase, generate new code, or answer programming questions.",
    timestamp: new Date().toISOString()
  }]);

  // Handle file selection
  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFilePath(filePath);
      
      // Fetch the file content
      const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      
      const fileData = await response.json();
      setSelectedFile(fileData);
    } catch (error: any) {
      console.error("Error loading file:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load file",
        variant: "destructive"
      });
    }
  };

  // Handle folder selection
  const handleFolderSelect = async () => {
    try {
      const response = await fetch('/api/folder/open', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to open folder: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.canceled) {
        return; // User canceled the dialog
      }
      
      setFileTree(data.fileTree);
      
      toast({
        title: "Folder Opened",
        description: `Project loaded: ${data.path}`,
      });
    } catch (error: any) {
      console.error("Error opening folder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open folder",
        variant: "destructive"
      });
    }
  };

  // Handle starting the codebase learning process
  const handleLearnCodebase = async () => {
    try {
      // Check if API keys are set
      if (!apiKeys.openai && !apiKeys.gemini) {
        toast({
          title: "API Keys Required",
          description: "Please configure your API keys in settings",
          variant: "destructive"
        });
        onOpenSettings();
        return;
      }
      
      // Start learning process
      setCodebaseStatus("learning");
      
      const response = await fetch('/api/codebase/learn', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start learning codebase");
      }
      
      // Start polling for status updates
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/codebase/status');
          const statusData = await statusResponse.json();
          
          setCodebaseStatus(statusData.status);
          
          if (statusData.status === "complete" || statusData.status === "error") {
            clearInterval(statusInterval);
            
            // Show appropriate toast based on status
            if (statusData.status === "complete") {
              toast({
                title: "Analysis Complete",
                description: "Codebase analysis has been completed successfully",
              });
              
              // Refresh the project data to get the updated index
              const projectResponse = await fetch('/api/project');
              const projectData = await projectResponse.json();
              
              // You might want to update the UI with the new analysis here
            } else {
              toast({
                title: "Analysis Failed",
                description: statusData.message || "Codebase analysis failed",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error checking status:", error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Clean up interval if component unmounts
      return () => clearInterval(statusInterval);
      
    } catch (error: any) {
      console.error("Error learning codebase:", error);
      setCodebaseStatus("error");
      
      toast({
        title: "Error",
        description: error.message || "Failed to learn codebase",
        variant: "destructive"
      });
    }
  };

  // Handle sending a message to the AI
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to conversation
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    try {
      // Check if API keys are set
      if (!apiKeys.openai && !apiKeys.gemini) {
        throw new Error("Please configure your API keys in settings");
      }
      
      // Send message to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversation: conversation.slice(-10) // Send last 10 messages for context
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI response");
      }
      
      // Get AI response
      const aiMessage = await response.json();
      
      // Add AI response to conversation
      setConversation(prev => [...prev, aiMessage]);
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Add error message to conversation
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${error.message || "Failed to generate a response"}`,
        timestamp: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI response",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">DeepCode</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left sidebar - Project explorer and codebase index */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <LeftSidebar 
              fileTree={fileTree}
              onFileSelect={handleFileSelect}
              onOpenFolder={handleFolderSelect}
              onLearnCodebase={handleLearnCodebase}
              codebaseStatus={codebaseStatus}
              selectedFilePath={selectedFilePath}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Main and bottom panels */}
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup direction="vertical">
              {/* Main code view */}
              <ResizablePanel defaultSize={70} minSize={30}>
                <CodeView file={selectedFile} />
              </ResizablePanel>
              
              <ResizableHandle />
              
              {/* Bottom AI chat panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <AIChat 
                  conversation={conversation}
                  onSendMessage={handleSendMessage}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
