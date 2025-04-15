import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CodeFile } from '../../../shared/types';

interface TheiaEditorProps {
  file: CodeFile | null;
}

// Simple code highlighting function
const highlightCode = (code: string, language: string): string => {
  // Basic syntax highlighting (simplified for MVP)
  let highlighted = code;
  
  // Replace keywords with span elements
  const keywords = [
    'function', 'const', 'let', 'var', 'if', 'else', 'while', 'for', 'return',
    'import', 'export', 'from', 'class', 'extends', 'async', 'await', 'try',
    'catch', 'switch', 'case', 'break', 'continue', 'default', 'new', 'this',
    'typeof', 'instanceof', 'throw', 'true', 'false', 'null', 'undefined'
  ];
  
  // Using string replacement to add spans (this is simplified - a real highlighter would be more complex)
  highlighted = highlighted.replace(
    new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'),
    '<span class="keyword">$1</span>'
  );
  
  // Highlight strings
  highlighted = highlighted.replace(
    /(['"`])(.*?)\1/g,
    '<span class="string">$&</span>'
  );
  
  // Highlight comments (simplified)
  highlighted = highlighted.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    '<span class="comment">$1</span>'
  );
  
  // Function calls
  highlighted = highlighted.replace(
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g,
    '<span class="function">$1</span>('
  );
  
  return highlighted;
};

export default function TheiaEditor({ file }: TheiaEditorProps) {
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Load Theia editor (simplified for MVP - just show highlighted code)
  useEffect(() => {
    if (file) {
      setLoading(true);
      
      // In a real implementation, we would initialize Theia here
      // For MVP, we'll just display the code with simple syntax highlighting
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }, [file]);
  
  if (!file) {
    return null;
  }
  
  // Format content for display
  const lines = file.content.split('\n');
  
  return (
    <div className="h-full overflow-hidden bg-background">
      {loading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div 
            ref={editorRef}
            className="font-mono text-sm p-2 min-h-full"
          >
            <pre className="font-mono">
              {lines.map((line, i) => (
                <div key={i} className="code-line flex hover:bg-muted/30">
                  <span className="line-number w-10 text-right pr-2 text-muted-foreground select-none">
                    {i + 1}
                  </span>
                  <span 
                    className="line-content flex-1"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCode(line, file.language || 'text')
                    }}
                  />
                </div>
              ))}
            </pre>
          </div>
        </ScrollArea>
      )}
      
      <style jsx>{`
        .keyword {
          color: #ec4899;
        }
        
        .function {
          color: #2dd4bf;
        }
        
        .string {
          color: #fcd34d;
        }
        
        .variable {
          color: #93c5fd;
        }
        
        .comment {
          color: #64748b;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
