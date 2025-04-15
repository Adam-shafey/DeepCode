import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Trash2, Bot, User, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
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
          
          <div className="p-3 border-t border-border">
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
