import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApiKeys } from '../../../shared/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export default function SettingsModal({ 
  open, 
  onOpenChange,
  apiKeys,
  onSave
}: SettingsModalProps) {
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai || '');
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [defaultModel, setDefaultModel] = useState<string>(
    apiKeys.openai ? 'openai' : (apiKeys.gemini ? 'gemini' : 'openai')
  );
  
  // Handle save
  const handleSave = () => {
    onSave({
      openai: openaiKey || undefined,
      gemini: geminiKey || undefined
    });
  };
  
  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API keys and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored securely on your device.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default-model">Default Model</Label>
            <Select 
              value={defaultModel} 
              onValueChange={setDefaultModel}
            >
              <SelectTrigger id="default-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                <SelectItem value="gemini">Google Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
