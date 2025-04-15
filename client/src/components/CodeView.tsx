import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import TheiaEditor from './TheiaEditor';
import { FileCode } from 'lucide-react';
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
          <div className="border-b border-border px-2 flex overflow-x-auto">
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
          </div>
          
          {/* Content for each tab */}
          {openTabs.map(tab => (
            <TabsContent 
              key={tab.path} 
              value={tab.path}
              className="flex-1 p-0 m-0 overflow-hidden"
            >
              <TheiaEditor file={file} />
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
