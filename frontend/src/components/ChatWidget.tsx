
import { useState } from 'react';
import { X, Send, MessageSquare, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWidget = ({ isOpen, onClose }: ChatWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm an AI assistant that knows all about this developer's background, skills, and projects. Feel free to ask me anything about their experience with Python, LLMs, RAG pipelines, or any of their projects!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sample responses for demonstration - in production, this would connect to your RAG system
  const sampleResponses: { [key: string]: string } = {
    'experience': "This developer has extensive experience in Python backend development, with a focus on building scalable systems and implementing LLM solutions. They've worked on RAG pipelines, infrastructure automation, and have handled systems processing millions of requests daily.",
    'skills': "Their core skills include Python (expert level), database management (PostgreSQL, MongoDB, Redis), LLM integration and RAG pipeline development, and infrastructure management with AWS, Docker, and Kubernetes.",
    'projects': "Some notable projects include an Intelligent Document RAG System using vector embeddings, a scalable backend architecture handling 1M+ daily requests, and infrastructure automation suites with comprehensive DevOps pipelines.",
    'rag': "They specialize in RAG (Retrieval Augmented Generation) pipelines, having built sophisticated systems for document analysis using vector embeddings, ChromaDB, and various LLM providers. Their RAG implementations focus on accuracy and scalability.",
    'default': "I'd be happy to help you learn more about this developer! You can ask me about their technical skills, project experience, background with LLMs and RAG systems, or anything else you'd like to know."
  };

  const getResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      return sampleResponses.experience;
    } else if (lowerMessage.includes('skill') || lowerMessage.includes('technical')) {
      return sampleResponses.skills;
    } else if (lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return sampleResponses.projects;
    } else if (lowerMessage.includes('rag') || lowerMessage.includes('llm') || lowerMessage.includes('ai')) {
      return sampleResponses.rag;
    } else {
      return sampleResponses.default;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg h-[600px] bg-orange-50 dark:bg-slate-900 border-orange-200 dark:border-slate-700 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-orange-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <MessageSquare className="w-5 h-5 text-orange-600 dark:text-blue-400" />
            AI Assistant
          </CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-card-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-orange-500 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-orange-600 dark:bg-blue-600 text-white'
                        : 'bg-orange-100 dark:bg-slate-800 text-foreground border border-orange-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-red-500 dark:bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 dark:bg-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-orange-100 dark:bg-slate-800 p-3 rounded-lg border border-orange-200 dark:border-slate-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-400 dark:bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-orange-400 dark:bg-gray-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-orange-400 dark:bg-gray-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-orange-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this developer..."
                className="flex-1 bg-orange-50 dark:bg-slate-800 border-orange-300 dark:border-slate-600 text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWidget;
