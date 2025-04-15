import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  Trash2, 
  Bot, 
  User, 
  Send, 
  Code, 
  Command, 
  Wand2, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown,
  Copy
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '../../../shared/types';

interface AIChatProps {
  conversation: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function AIChat({ conversation, onSendMessage }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom of chat when conversation changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversation]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Message templates for quick prompts
  const messageTemplates = [
    { icon: <Code className="h-4 w-4" />, text: "Explain this code", prompt: "Explain what this code does in simple terms:" },
    { icon: <Wand2 className="h-4 w-4" />, text: "Improve code", prompt: "How can I improve this code:" },
    { icon: <Command className="h-4 w-4" />, text: "Generate test", prompt: "Generate a unit test for this code:" },
    { icon: <Sparkles className="h-4 w-4" />, text: "Find bugs", prompt: "Find potential bugs in this code:" },
  ];

  // Handle template selection
  const handleTemplateClick = (prompt: string) => {
    setMessage(prompt + "\n\n```\n// Paste your code here\n```");
    // Focus and place cursor after the prompt
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Place cursor after the prompt
        const cursorPosition = prompt.length + 6; // +6 for the newlines and start of code block
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Define types for message content
  type MessageContentPart = 
    | { type: 'text'; content: string } 
    | { type: 'code'; language: string; content: string };

  // Format code blocks in messages
  const formatMessageContent = (content: string): MessageContentPart[] => {
    // Simple regex to identify code blocks with language
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts: MessageContentPart[] = [];
    let lastIndex = 0;
    let match;
    
    // Find all code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add code block
      const language = match[1] || 'text';
      const code = match[2];
      parts.push({
        type: 'code',
        language,
        content: code
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last code block
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    // If no code blocks were found, treat entire content as text
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content
      });
    }
    
    return parts;
  };
  
  // Copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Show toast or notification here if you have one
        console.log('Code copied to clipboard');
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <div className={cn(
      "flex flex-col border-t border-border bg-card",
      "h-full transition-all duration-300"
    )}>
      <div className="p-2 border-b border-border flex justify-between items-center">
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            title="Clear Chat"
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            title="Toggle Panel"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <ChevronDown className={cn(
              "h-3.5 w-3.5",
              isMinimized && "transform rotate-180"
            )} />
          </Button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start space-x-2",
                    msg.role === "user" && "justify-end",
                  )}
                >
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-2.5 rounded-lg text-sm max-w-[85%]",
                    msg.role === "user" 
                      ? "bg-primary/20 text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {formatMessageContent(msg.content).map((part, i) => (
                      <div key={i} className={i > 0 ? 'mt-3' : ''}>
                        {part.type === 'text' ? (
                          <div className="whitespace-pre-wrap">
                            {part.content.split('\n').map((line, j) => (
                              <p key={j} className={j > 0 ? 'mt-1' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="relative mt-2 mb-1">
                            <div className="absolute right-2 top-2 flex space-x-1">
                              <Badge variant="outline" className="text-xs bg-muted/50">
                                {part.language}
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 bg-muted/50"
                                      onClick={() => copyToClipboard(part.content)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Copy code</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <pre className="bg-black/90 text-gray-200 p-3 rounded-md overflow-x-auto text-xs">
                              <code>{part.content}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Show feedback buttons only for AI responses */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-end mt-2 space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Not helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Template buttons */}
          <div className="flex items-center space-x-1 px-3 pt-2">
            {messageTemplates.map((template, i) => (
              <Button 
                key={i}
                variant="outline" 
                size="sm"
                className="text-xs h-7 bg-muted/40"
                onClick={() => handleTemplateClick(template.prompt)}
              >
                {template.icon}
                <span className="ml-1">{template.text}</span>
              </Button>
            ))}
          </div>
          
          <div className="p-3 border-t border-border mt-2">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your code..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
