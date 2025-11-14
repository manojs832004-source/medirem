
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { getUIContent, LanguageKey } from '@/lib/languages';
import { suggestMedicationAction } from './actions';
import { Loader2, Send, User, Bot, ShieldAlert, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';


interface Message {
  role: 'user' | 'model';
  content: string;
}

const languageMap: Record<LanguageKey, string> = {
  'en-US': 'English',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'ja-JP': 'Japanese',
  'hi-IN': 'Hindi',
  'ta-IN': 'Tamil',
};


export default function SuggestionsPage() {
  const [language] = useLocalStorage<LanguageKey>('language', 'en-US');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const content = getUIContent(language);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([
      { role: 'model', content: `Hello! I'm here to help. ${content.describeSymptoms}` }
    ]);
  }, [content.describeSymptoms, language]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const languageName = languageMap[language] || 'English';
      const result = await suggestMedicationAction(currentInput, languageName);
      
      if (result.success && result.suggestion) {
        setMessages(prev => [...prev, { role: 'model', content: result.suggestion! }]);
      } else {
        const errorMessage = result.error || 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        setMessages(prev => [...prev, { role: 'model', content: `Sorry, I couldn't get a suggestion. ${errorMessage}` }]);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      setMessages(prev => [...prev, { role: 'model', content: `Sorry, an unexpected error occurred. ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-foreground bg-background">
       <header className="container mx-auto p-4 md:p-6 flex items-center justify-between sticky top-0 bg-background z-10 border-b">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
           <ChevronLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-xl font-bold">Suggestions</h1>
         <div className="w-10"></div>
       </header>
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        <div className="flex-grow flex flex-col w-full max-w-3xl mx-auto">
          <Alert variant="destructive" className="mt-4 bg-red-100 dark:bg-red-900/30 border-red-500/50 text-red-700 dark:text-red-300 rounded-2xl">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className='font-bold'>Disclaimer</AlertTitle>
              <AlertDescription>
                {content.disclaimer}
              </AlertDescription>
            </Alert>
          <div ref={chatContainerRef} className="flex-grow overflow-auto space-y-6 p-6 mt-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                 {message.role === 'model' && (
                    <div className="p-2 bg-primary/20 rounded-full">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <User className="h-6 w-6 text-foreground" />
                    </div>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="rounded-2xl px-4 py-3 max-w-[80%] bg-card flex items-center shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t sticky bottom-24 bg-background">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Textarea
                placeholder={content.describeSymptoms}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow resize-none rounded-xl bg-card border-none focus-visible:ring-primary"
                disabled={isLoading}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                    }
                }}
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
