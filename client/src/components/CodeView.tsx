import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import TheiaEditor from './TheiaEditor';
import { 
  FileCode, 
  Code, 
  Bug, 
  MessageSquare, 
  RefreshCw, 
  ChevronDown, 
  Sparkles,
  Wrench,
  FileLineChart,
  TestTube,
  Brain,
  BookOpen,
  Briefcase,
  LineChart,
  Network
} from 'lucide-react';
import type { CodeFile } from '../../../shared/types';

interface CodeViewProps {
  file: CodeFile | null;
}

interface OpenTab {
  path: string;
  filename: string;
}

export default function CodeView({ file }: CodeViewProps) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Update open tabs when a file is opened
  useEffect(() => {
    if (file && file.path) {
      // Check if the file is already open in a tab
      const isOpen = openTabs.some(tab => tab.path === file.path);
      
      if (!isOpen) {
        // Extract filename from path
        const filename = file.path.split('/').pop() || file.path;
        
        // Add the file to open tabs
        setOpenTabs(prev => [...prev, { path: file.path, filename }]);
      }
      
      // Set as active tab
      setActiveTab(file.path);
    }
  }, [file]);

  // AI action to comment code
  const handleCommentCode = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setCurrentAction("commenting");
      
      // Send file content to server for AI processing
      const response = await fetch('/api/ai/comment-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path,
          content: file.content,
          language: file.language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to comment code");
      }
      
      const result = await response.json();
      
      // Success toast
      toast({
        title: "Code Commented",
        description: "Added comprehensive comments to improve code readability",
      });
      
      // You would typically update the file content here or refresh the file
      
    } catch (error: any) {
      console.error("Error commenting code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to comment code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // AI action to detect bugs
  const handleDetectBugs = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setCurrentAction("detecting bugs");
      
      // Send file content to server for AI processing
      const response = await fetch('/api/ai/detect-bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path,
          content: file.content,
          language: file.language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to detect bugs");
      }
      
      const result = await response.json();
      
      // Success toast and show results in chat or a modal
      toast({
        title: "Bug Analysis Complete",
        description: `Found ${result.issues?.length || 0} potential issues`,
      });
      
    } catch (error: any) {
      console.error("Error detecting bugs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to detect bugs",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // AI action to optimize code
  const handleOptimizeCode = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setCurrentAction("optimizing");
      
      // Send file content to server for AI processing
      const response = await fetch('/api/ai/optimize-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path,
          content: file.content,
          language: file.language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to optimize code");
      }
      
      const result = await response.json();
      
      // Success toast
      toast({
        title: "Code Optimized",
        description: "Improved code efficiency and readability",
      });
      
      // You would typically update the file content here
      
    } catch (error: any) {
      console.error("Error optimizing code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to optimize code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // AI action to generate test cases
  const handleGenerateTests = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setCurrentAction("generating tests");
      
      // Send file content to server for AI processing
      const response = await fetch('/api/ai/generate-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path,
          content: file.content,
          language: file.language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate tests");
      }
      
      const result = await response.json();
      
      // Success toast
      toast({
        title: "Test Cases Generated",
        description: "Created comprehensive test suite for your code",
      });
      
    } catch (error: any) {
      console.error("Error generating tests:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate tests",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };
  
  // AI action to explain code for product managers
  const handleExplainCode = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setCurrentAction("explaining code");
      
      // Send file content to server for AI processing
      const response = await fetch('/api/ai/explain-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path,
          content: file.content,
          language: file.language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to explain code");
      }
      
      const result = await response.json();
      
      // Success toast
      toast({
        title: "Code Explanation Added",
        description: "Created business-friendly explanation of this code",
      });
      
      // Show a modal with the explanation or update learning panel
      
    } catch (error: any) {
      console.error("Error explaining code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to explain code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };
  
  // AI action to analyze project dependencies
  const handleAnalyzeDependencies = async () => {
    try {
      setIsProcessing(true);
      setCurrentAction("analyzing dependencies");
      
      // Send request to analyze dependencies
      const response = await fetch('/api/ai/analyze-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze dependencies");
      }
      
      const result = await response.json();
      
      // Success toast
      toast({
        title: "Dependency Analysis Complete",
        description: "Analyzed project dependencies and added to learning panel",
      });
      
    } catch (error: any) {
      console.error("Error analyzing dependencies:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze dependencies",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };
  
  // Close a tab
  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove the tab
    setOpenTabs(prev => prev.filter(tab => tab.path !== path));
    
    // If the active tab is being closed, set another tab as active
    if (activeTab === path) {
      if (openTabs.length > 1) {
        const index = openTabs.findIndex(tab => tab.path === path);
        const newActiveIndex = index === 0 ? 1 : index - 1;
        setActiveTab(openTabs[newActiveIndex].path);
      } else {
        setActiveTab(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs for open files */}
      {openTabs.length > 0 ? (
        <Tabs 
          value={activeTab || undefined} 
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b border-border px-2 flex justify-between overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 justify-start">
              {openTabs.map(tab => (
                <TabsTrigger
                  key={tab.path}
                  value={tab.path}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 h-[34px] text-xs relative"
                >
                  <FileCode className="h-3.5 w-3.5 mr-1.5" />
                  {tab.filename}
                  <button
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => closeTab(tab.path, e)}
                  >
                    &times;
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {file && (
              <div className="flex items-center space-x-1 pr-2">
                {isProcessing ? (
                  <Button variant="ghost" size="sm" disabled className="h-7 px-2">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {currentAction && currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}...
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Brain className="h-3.5 w-3.5 mr-1.5" />
                        AI Actions
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Engineering
                      </div>
                      <DropdownMenuItem onClick={handleCommentCode}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Document Code</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDetectBugs}>
                        <Bug className="mr-2 h-4 w-4" />
                        <span>Analyze for Bugs</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOptimizeCode}>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Optimize Code</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleGenerateTests}>
                        <TestTube className="mr-2 h-4 w-4" />
                        <span>Generate Tests</span>
                      </DropdownMenuItem>

                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
                        Product Management
                      </div>
                      <DropdownMenuItem onClick={handleExplainCode} className="text-blue-500 hover:text-blue-600">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Explain in Business Terms</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAnalyzeDependencies} className="text-blue-500 hover:text-blue-600">
                        <Network className="mr-2 h-4 w-4" />
                        <span>Analyze Dependencies</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
          
          {/* Content for each tab */}
          {openTabs.map(tab => (
            <TabsContent 
              key={tab.path} 
              value={tab.path}
              className="flex-1 p-0 m-0 overflow-hidden relative"
            >
              <TheiaEditor file={file} />
              
              {/* Overlay when processing */}
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
                  <div className="bg-card rounded-lg p-6 shadow-lg flex flex-col items-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-4">
                      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      {currentAction && currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}...
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {currentAction === 'commenting' && 'Adding helpful comments to your code...'}
                      {currentAction === 'detecting bugs' && 'Analyzing your code for potential issues...'}
                      {currentAction === 'optimizing' && 'Optimizing your code for better performance...'}
                      {currentAction === 'generating tests' && 'Creating comprehensive tests for your code...'}
                      {currentAction === 'explaining code' && 'Creating a business-friendly explanation...'}
                      {currentAction === 'analyzing dependencies' && 'Analyzing project dependencies...'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Empty state when no files are open
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FileCode className="h-16 w-16 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No file open</h3>
          <p className="text-sm mt-1">Select a file from the explorer to view its content</p>
        </div>
      )}
    </div>
  );
}
