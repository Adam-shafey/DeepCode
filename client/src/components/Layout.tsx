import { ReactNode, useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import LeftSidebar from './LeftSidebar';
import CodeView from './CodeView';
import AIChat from './AIChat';
import { useToast } from '@/hooks/use-toast';
import SettingsModal from './SettingsModal';
import { 
  Code, 
  Settings, 
  Home, 
  Zap, 
  Search, 
  Moon, 
  Sun,
  BarChart, 
  Compass,
  Braces,
  GitBranch,
  Folder,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
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

  // Add state for current view and theme
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const isMobile = useIsMobile();
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // In a full implementation, this would update the theme in theme.json
  };
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with enhanced navigation */}
      <header className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">DeepDe</span>
            <span className="text-primary">:</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">code</span>
          </h1>
          <Badge variant="outline" className="ml-2 text-xs">v0.3</Badge>
        </div>
        
        {/* Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <Button 
            variant={currentView === "dashboard" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="gap-1"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant={currentView === "editor" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setCurrentView("editor")}
            className="gap-1"
          >
            <Braces className="h-4 w-4" />
            Code Editor
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="p-6 h-full overflow-auto">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Welcome to 
                <span className="bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">DeepDe</span>
                <span className="text-primary">:</span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">code</span>
              </h1>
              
              {/* Project Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Your Project</h2>
                  <Button variant="outline" size="sm" onClick={handleFolderSelect}>
                    {fileTree ? "Change Project" : "Open Project"}
                  </Button>
                </div>
                
                {fileTree ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{fileTree.name}</CardTitle>
                      <CardDescription>{fileTree.path}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                          <Braces className="h-10 w-10 text-primary mb-2" />
                          <span className="text-sm font-medium">Code Files</span>
                          <span className="text-2xl font-bold">{fileTree.children?.length || 0}</span>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                          <GitBranch className="h-10 w-10 text-primary mb-2" />
                          <span className="text-sm font-medium">Analysis Status</span>
                          <Badge variant={codebaseStatus === "complete" ? "success" : (codebaseStatus === "learning" ? "default" : "secondary")}>
                            {codebaseStatus === "learning" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                            {codebaseStatus.charAt(0).toUpperCase() + codebaseStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                          <BarChart className="h-10 w-10 text-primary mb-2" />
                          <span className="text-sm font-medium">AI Insights</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleLearnCodebase}
                            disabled={codebaseStatus === "learning"}
                            className="mt-1"
                          >
                            {codebaseStatus === "complete" ? "Re-analyze" : "Analyze Now"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="default" className="w-full" onClick={() => setCurrentView("editor")}>
                        Open in Editor
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Folder className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Project Open</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Open a project folder to start analyzing your code with AI
                      </p>
                      <Button onClick={handleFolderSelect}>
                        Open Folder
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Features Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="rounded-full bg-blue-500/10 p-2 w-fit mb-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardTitle>AI Code Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Analyze your entire codebase with AI to quickly understand structure and functionality</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="rounded-full bg-purple-500/10 p-2 w-fit mb-2">
                        <Search className="h-5 w-5 text-purple-500" />
                      </div>
                      <CardTitle>Intelligent Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Ask questions about your code in natural language and get contextual answers</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="rounded-full bg-pink-500/10 p-2 w-fit mb-2">
                        <Compass className="h-5 w-5 text-pink-500" />
                      </div>
                      <CardTitle>Code Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Easily navigate complex codebases with visual file structure and relationships</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* Editor View with code and chat */}
        {currentView === "editor" && (
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
        )}
      </main>
      
      {/* Mobile bottom navigation */}
      {isMobile && (
        <div className="md:hidden border-t border-border p-2 bg-background">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("dashboard")}
              className={currentView === "dashboard" ? "text-primary" : ""}
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("editor")}
              className={currentView === "editor" ? "text-primary" : ""}
            >
              <Braces className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
