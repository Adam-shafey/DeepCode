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
      
      {/* Codebase Index (AI-generated) */}
      <div className="border-t border-border">
        <div className="p-2 text-sm font-semibold flex items-center justify-between bg-muted/30">
          <span>Codebase Index</span>
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
            ) : fileTree ? (
              <div className="text-center py-4 text-muted-foreground">
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
              <div className="text-center py-4 text-muted-foreground">
                <p>Open a folder to analyze the codebase</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
