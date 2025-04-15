import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  File, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw,
  BookOpen,
  Network,
  Briefcase,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FileEntry, CodeExplanation, DependencyAnalysis } from '../../../shared/types';

interface LeftSidebarProps {
  fileTree: FileEntry | null;
  onFileSelect: (filePath: string) => void;
  onOpenFolder: () => void;
  onLearnCodebase: () => void;
  codebaseStatus: string;
  selectedFilePath: string | null;
}

export default function LeftSidebar({
  fileTree,
  onFileSelect,
  onOpenFolder,
  onLearnCodebase,
  codebaseStatus,
  selectedFilePath
}: LeftSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [codebaseIndex, setCodebaseIndex] = useState<any | null>(null);
  const [codeExplanations, setCodeExplanations] = useState<CodeExplanation[]>([]);
  const [dependencyAnalytics, setDependencyAnalytics] = useState<DependencyAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<string>("engineering");
  
  // Fetch codebase index when component loads
  useEffect(() => {
    const fetchCodebaseIndex = async () => {
      try {
        const response = await fetch('/api/project');
        if (response.ok) {
          const projectData = await response.json();
          if (projectData.codebaseIndex) {
            setCodebaseIndex(projectData.codebaseIndex);
          }
        }
      } catch (error) {
        console.error("Error fetching codebase index:", error);
      }
    };
    
    fetchCodebaseIndex();
  }, [codebaseStatus]); // Refetch when status changes
  
  // Fetch code explanations for Product Managers
  useEffect(() => {
    const fetchCodeExplanations = async () => {
      try {
        const response = await fetch('/api/codebase/explanations');
        if (response.ok) {
          const data = await response.json();
          if (data.explanations) {
            setCodeExplanations(data.explanations);
          }
        }
      } catch (error) {
        console.error("Error fetching code explanations:", error);
      }
    };
    
    if (codebaseStatus === 'complete') {
      fetchCodeExplanations();
    }
  }, [codebaseStatus]);
  
  // Fetch dependency analytics for Product Managers
  useEffect(() => {
    const fetchDependencyAnalytics = async () => {
      try {
        const response = await fetch('/api/codebase/dependencies');
        if (response.ok) {
          const data = await response.json();
          if (data.dependencies) {
            setDependencyAnalytics(data.dependencies);
          }
        }
      } catch (error) {
        console.error("Error fetching dependency analytics:", error);
      }
    };
    
    if (codebaseStatus === 'complete') {
      fetchDependencyAnalytics();
    }
  }, [codebaseStatus]);
  
  // Toggle folder expanded state
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  // Render file tree recursively
  const renderFileTree = (entry: FileEntry, depth = 0) => {
    const isExpanded = expandedFolders.has(entry.path);
    const isSelected = entry.path === selectedFilePath;
    
    return (
      <div key={entry.path} className="select-none">
        <div 
          className={cn(
            "flex items-center space-x-1 p-1 rounded text-sm cursor-pointer",
            isSelected && "bg-accent/20 text-accent",
            !isSelected && "hover:bg-accent/10"
          )}
          style={{ paddingLeft: `${depth * 12}px` }}
          onClick={() => {
            if (entry.isDirectory) {
              toggleFolder(entry.path);
            } else {
              onFileSelect(entry.path);
            }
          }}
        >
          {entry.isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
              ) : (
                <Folder className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5" /> {/* Spacer for alignment */}
              <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
            </>
          )}
          <span className="truncate">{entry.name}</span>
        </div>
        
        {entry.isDirectory && isExpanded && entry.children && (
          <div>
            {entry.children.map(child => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Get status badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'idle': return 'secondary';
      case 'learning': return 'default';
      case 'complete': return 'success';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };
  
  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="flex justify-between items-center p-2 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Project Explorer</h2>
        <Button 
          variant="ghost" 
          size="icon"
          title="Open Folder"
          onClick={onOpenFolder}
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Learning status indicator */}
      <div className="px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs">Codebase Status</span>
          <Badge variant={getStatusBadgeVariant(codebaseStatus)}>
            {codebaseStatus === 'learning' && (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            )}
            {formatStatus(codebaseStatus)}
          </Badge>
        </div>
      </div>
      
      {/* File explorer tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {fileTree ? (
            renderFileTree(fileTree)
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No folder open</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={onOpenFolder}
              >
                Open Folder
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* AI Insights Section with Tabs */}
      <div className="border-t border-border">
        <div className="p-2 text-sm font-semibold flex items-center justify-between bg-muted/30">
          <span>AI Insights</span>
          <Button 
            variant="ghost" 
            size="icon"
            title="Analyze Codebase"
            onClick={onLearnCodebase}
            disabled={codebaseStatus === 'learning'}
          >
            <RefreshCw className={cn(
              "h-3.5 w-3.5",
              codebaseStatus === 'learning' && "animate-spin"
            )} />
          </Button>
        </div>
        
        {codebaseIndex || codeExplanations.length > 0 || dependencyAnalytics ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border">
              <TabsList className="w-full bg-transparent">
                <TabsTrigger 
                  value="engineering" 
                  className="flex-1 text-xs h-8 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none"
                >
                  <Code className="h-3.5 w-3.5 mr-1.5" />
                  Engineering
                </TabsTrigger>
                <TabsTrigger 
                  value="product"
                  className="flex-1 text-xs h-8 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:rounded-none"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  Product
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Engineering Tab Content */}
            <TabsContent value="engineering" className="m-0">
              <ScrollArea className="max-h-64">
                <div className="p-3 text-xs space-y-2">
                  {codebaseIndex ? (
                    <>
                      <div>
                        <h3 className="font-semibold text-primary mb-1">Key Components</h3>
                        <ul className="list-disc pl-4 space-y-1">
                          {codebaseIndex.keyComponents.map((comp: any, i: number) => (
                            <li key={i}>
                              <span className="text-blue-400">{comp.name}</span>: {comp.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-primary mb-1">Core Functionality</h3>
                        <ul className="list-disc pl-4 space-y-1">
                          {codebaseIndex.coreFunctionality.map((func: any, i: number) => (
                            <li key={i}>
                              <span className="text-green-400">{func.name}</span>: {func.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No engineering insights available yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Product Management Tab Content */}
            <TabsContent value="product" className="m-0">
              <ScrollArea className="max-h-64">
                <div className="p-3 text-xs space-y-2">
                  {/* Code Explanations Section */}
                  {codeExplanations && codeExplanations.length > 0 ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
                        <h3 className="font-semibold text-blue-500">Business Explanations</h3>
                      </div>
                      <div className="space-y-2">
                        {codeExplanations.map((explanation, i) => (
                          <div key={i} className="bg-blue-500/5 p-2 rounded border border-blue-500/20">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{explanation.path.split('/').pop()}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={explanation.businessImpact === 'high' ? 'default' : (explanation.businessImpact === 'medium' ? 'outline' : 'secondary')} className="text-[10px] h-4">
                                      {explanation.businessImpact.toUpperCase()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Business Impact: {explanation.businessImpact}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-muted-foreground mb-1">{explanation.explanation}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {explanation.concepts.slice(0, 3).map((concept, j) => (
                                <Badge key={j} variant="outline" className="text-[9px] py-0 h-4 bg-blue-500/10">
                                  {concept}
                                </Badge>
                              ))}
                              {explanation.concepts.length > 3 && (
                                <Badge variant="outline" className="text-[9px] py-0 h-4 bg-blue-500/10">
                                  +{explanation.concepts.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-500/5 p-2 rounded border border-blue-500/20 text-center">
                      <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-400/50" />
                      <p className="text-muted-foreground">No code explanations yet</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Use "Explain in Business Terms" to add explanations
                      </p>
                    </div>
                  )}
                  
                  {/* Dependency Analysis Section */}
                  {dependencyAnalytics ? (
                    <div className="mt-3">
                      <div className="flex items-center mb-2">
                        <Network className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
                        <h3 className="font-semibold text-blue-500">Dependency Analysis</h3>
                      </div>
                      <div className="bg-blue-500/5 p-2 rounded border border-blue-500/20">
                        <p className="text-muted-foreground mb-2">{dependencyAnalytics.summary}</p>
                        
                        <h4 className="text-[11px] font-medium mb-1">Project Dependencies</h4>
                        <div className="mb-2">
                          {dependencyAnalytics.projectDependencies.slice(0, 5).map((dep, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                              <span className="font-medium">{dep.name}</span>
                              <span className="text-muted-foreground">{dep.version}</span>
                            </div>
                          ))}
                          {dependencyAnalytics.projectDependencies.length > 5 && (
                            <div className="text-center text-[10px] text-muted-foreground">
                              +{dependencyAnalytics.projectDependencies.length - 5} more dependencies
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-500/5 p-2 rounded border border-blue-500/20 text-center mt-2">
                      <Network className="h-5 w-5 mx-auto mb-1 text-blue-400/50" />
                      <p className="text-muted-foreground">No dependency analysis yet</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Use "Analyze Dependencies" to add insights
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : fileTree ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            <p>No codebase analysis yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={onLearnCodebase}
              disabled={codebaseStatus === 'learning'}
            >
              Analyze Codebase
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            <p>Open a folder to analyze the codebase</p>
          </div>
        )}
      </div>
    </div>
  );
}
