
import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageSquare, User, Bot, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { env } from '@/config/env';
import { endpoints, buildUrl } from '@/config/endpoints';
import { apiClient, apiFetch } from '@/lib/apiClient';
import { toast as notify } from '@/components/ui/sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const normalizeMarkdown = (input: string): string => {
  let s = String(input ?? '');
  s = s.replace(/\r\n?/g, '\n');
  // Convert en/em/• bullets at line start to markdown hyphen bullets
  s = s.replace(/^\s*[–—•]\s+/gm, '- ');
  s = s.replace(/^(\s{2,})[–—•]\s+/gm, '$1- ');
  // Ensure a blank line before headings and top-level list items so Markdown parses in-flight
  s = s.replace(/(^|[^\n])\n(#{1,6}\s)/g, (m, p1, p2) => `${p1}\n\n${p2}`);
  s = s.replace(/(^|[^\n])\n(-\s)/g, (m, p1, p2) => `${p1}\n\n${p2}`);
  // If headings or lists appear mid-sentence (chunk boundary artifacts), insert needed newlines
  s = s.replace(/([^\n])\s*(#{1,6}\s)/g, '$1\n\n$2');
  s = s.replace(/([^\n])\s*(-\s)/g, '$1\n$2');
  s = s.replace(/([^\n])\s*((?:\d+\.|\d+\))\s)/g, '$1\n$2');
  // If inside an unclosed fenced code block while streaming, temporarily close it
  const fenceCountBackticks = (s.match(/```/g) || []).length;
  const fenceCountTildes = (s.match(/~~~?/g) || []).length; // support ~~~
  const endsWithFenceStart = /```[a-zA-Z0-9_-]*\s*$/.test(s) || /~~~[a-zA-Z0-9_-]*\s*$/.test(s);
  if (fenceCountBackticks % 2 === 1 || fenceCountTildes % 2 === 1 || endsWithFenceStart) {
    // Add a closing fence just for rendering; does not mutate stored message
    s = s + (s.endsWith('\n') ? '' : '\n') + '```\n';
  }
  if (!s.endsWith('\n')) s += '\n';
  return s;
};

// Decode various possible SSE payload formats to a plain text chunk
const decodeStreamData = (raw: string): string => {
  let data = String(raw ?? '');
  if (!data) return '';
  // Common cases: JSON string token, JSON object with token/text/content/delta, or plain text
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as any).token ?? (parsed as any).delta ?? (parsed as any).content ?? (parsed as any).text ?? (parsed as any).message;
      if (typeof candidate === 'string') return candidate;
    }
  } catch {
    // not JSON, continue
  }
  // Sometimes servers double-stringify: "Hello" or escape newlines
  if ((data.startsWith('"') && data.endsWith('"')) || (data.startsWith("'") && data.endsWith("'"))) {
    try {
      const dequoted = JSON.parse(data);
      if (typeof dequoted === 'string') data = dequoted;
    } catch {
      data = data.slice(1, -1);
    }
  }
  data = data.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '');
  // Ignore common done markers
  if (data === '[DONE]' || data === 'DONE' || data === '<|eot_id|>') return '';
  return data;
};

// Perform a final cleanup after streaming ends to guarantee good Markdown structure
const finalizeMarkdown = (input: string): string => {
  let s = String(input ?? '');
  s = s.replace(/\r\n?/g, '\n');
  // Headings and list items: ensure they start on their own line with a blank line before
  s = s.replace(/([^\n])\s*(#{1,6}\s)/g, '$1\n\n$2');
  s = s.replace(/([^\n])\s*(-\s)/g, '$1\n$2');
  s = s.replace(/([^\n])\s*((?:\d+\.|\d+\))\s)/g, '$1\n$2');
  // Collapse excessive blank lines to at most two
  s = s.replace(/\n{3,}/g, '\n\n');
  if (!s.endsWith('\n')) s += '\n';
  return s;
};

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

class MarkdownBoundary extends React.Component<{ fallback: React.ReactNode; resetKey: string; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) {
    // eslint-disable-next-line no-console
    console.error('Markdown render error', err);
  }
  componentDidUpdate(prevProps: Readonly<{ fallback: React.ReactNode; resetKey: string; children: React.ReactNode }>): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) return this.props.fallback as any;
    return this.props.children as any;
  }
}

// Note: We previously used an error boundary fallback for markdown.
// Rendering errors are unlikely with react-markdown, and the fallback could mask formatting.
// We render markdown directly to ensure live formatting.

const ChatWidget = ({ isOpen, onClose }: ChatWidgetProps) => {
  const { language } = useSettings();
  const t = translations[language];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMultilineInput, setIsMultilineInput] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const csrfTokenRef = useRef<string | null>(null);
  const hasReceivedFirstChunkRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const closeExistingStream = () => {
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch { /* noop */ }
      eventSourceRef.current = null;
    }
  };

  const hydrateMessagesIfNeeded = async () => {
    const storedKey = localStorage.getItem('vex_chat_session_key');
    sessionKeyRef.current = storedKey;
    if (!storedKey || env.mock) return;
    try {
      const data = await apiClient.get<any>(endpoints.vex.messages.list, {
        session: storedKey,
        ordering: 'created_at',
      });
      const items: any[] = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      if (items.length) {
        const mapped: Message[] = items.map((m, idx) => {
          const isUser = (m.role === 'user') || (m.is_user === true) || (m.sender === 'user');
          const text = m.text || m.content || m.message || '';
          const ts = m.created_at || m.timestamp || new Date().toISOString();
          return {
            id: String(m.id ?? idx),
            text: String(text),
            isUser,
            timestamp: new Date(ts),
          };
        });
        setMessages(mapped);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to hydrate chat history', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    hydrateMessagesIfNeeded();
    return () => {
      // Restore body scroll
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      // Close stream when widget closes
      closeExistingStream();
      setIsStreaming(false);
      setIsLoading(false);
      hasReceivedFirstChunkRef.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      closeExistingStream();
    };
  }, []);

  // Scroll to bottom on open and on any message or loading change
  useEffect(() => {
    if (!isOpen) return;
    // Defer to let DOM render
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, messages, isLoading, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const question = inputValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsMultilineInput(false);
    // Reset textarea height back to a single line
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
      }
    });

    if (env.mock) {
      setIsLoading(true);
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getResponse(question),
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      setIsLoading(true);
      setIsStreaming(true);
      hasReceivedFirstChunkRef.current = false;
      // Step 1-3: POST to obtain/confirm session_key (multipart/form-data)
      const form = new FormData();
      form.append('question', question);
      const existingKey = localStorage.getItem('vex_chat_session_key');
      if (existingKey) form.append('session_key', existingKey);

      const postResp = await apiFetch<{ session_key: string; csrftoken: string }>(
        endpoints.vex.chat.post,
        {
          method: 'POST',
          // Include CSRF token if we have one from previous round
          headers: csrfTokenRef.current ? { 'X-CSRFToken': csrfTokenRef.current } : undefined,
          body: form as unknown as any,
        }
      );

      const newSessionKey = postResp?.session_key;
      const newCsrf = postResp?.csrftoken;
      if (newSessionKey) {
        sessionKeyRef.current = newSessionKey;
        localStorage.setItem('vex_chat_session_key', newSessionKey);
      }
      if (newCsrf) {
        csrfTokenRef.current = newCsrf;
      }

      const sessionKey = sessionKeyRef.current || existingKey;
      if (!sessionKey) {
        throw new Error('No session key provided by server');
      }

      // Step 4: Open SSE stream
      closeExistingStream();
      const streamUrl = buildUrl(endpoints.vex.chat.stream, {
        question: question,
        session_key: sessionKey,
      });
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('received', () => {
        // Keep typing indicator until first data chunk arrives
      });

      es.addEventListener('finished', () => {
        setIsStreaming(false);
        // Finalize the last assistant message markdown once stream completes
        setMessages(prev => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (!next[i].isUser) {
              next[i] = { ...next[i], text: finalizeMarkdown(next[i].text) };
              break;
            }
          }
          return next;
        });
        try { es.close(); } catch { /* noop */ }
        if (eventSourceRef.current === es) eventSourceRef.current = null;
      });

      es.addEventListener('error', (ev: any) => {
        const dataMsg = typeof ev?.data === 'string' ? ev.data : undefined;
        if (!hasReceivedFirstChunkRef.current) setIsLoading(false);
        setIsStreaming(false);
        try { es.close(); } catch { /* noop */ }
        if (eventSourceRef.current === es) eventSourceRef.current = null;
        notify.error(dataMsg || 'Streaming error');
      });

      es.onmessage = (e: MessageEvent) => {
        // Streamed text chunks come as default messages without an event name
        const chunk = decodeStreamData(String(e.data ?? ''));
        if (!chunk) return;
        if (!hasReceivedFirstChunkRef.current) {
          hasReceivedFirstChunkRef.current = true;
          setIsLoading(false); // remove typing indicator once streaming starts
          // Create an assistant message to append chunks to
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            text: chunk,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          // Append to last assistant message
          setMessages(prev => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (!next[i].isUser) {
                next[i] = { ...next[i], text: next[i].text + chunk };
                break;
              }
            }
            return next;
          });
        }
      };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Chat send failed', err);
      setIsLoading(false);
      setIsStreaming(false);
      closeExistingStream();
      notify.error(err?.message || 'Failed to send message');
    }
  };

  const handleClearChat = () => {
    try { closeExistingStream(); } catch { /* noop */ }
    sessionKeyRef.current = null;
    csrfTokenRef.current = null;
    localStorage.removeItem('vex_chat_session_key');
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    hasReceivedFirstChunkRef.current = false;
    notify.success('Chat cleared');
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
      <Card className="w-full max-w-6xl h-[800px] bg-orange-50 dark:bg-slate-900 border-orange-200 dark:border-slate-700 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-orange-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <MessageSquare className="w-5 h-5 text-orange-600 dark:text-blue-400" />
            Vex
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleClearChat}
              variant="outline"
              size="sm"
              className="border-orange-300 hover:border-orange-500 dark:border-slate-600 dark:hover:border-blue-400 text-muted-foreground"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-card-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && !isLoading && !isStreaming ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400 flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                    {t.chat?.prompt}
                  </h3>
                </div>
              </div>
            ) : (
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
                      className={`max-w-[80%] p-3 rounded-lg prose prose-sm dark:prose-invert prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-3 prose-pre:rounded-md prose-code:before:content-[''] prose-code:after:content-[''] prose-headings:font-semibold prose-headings:leading-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-ul:list-disc prose-ol:list-decimal prose-ul:ml-5 prose-ol:ml-5 prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-hr:my-3 ${
                        message.isUser
                          ? 'bg-orange-600 dark:bg-blue-600 text-white prose-invert'
                          : 'bg-orange-100 dark:bg-slate-800 text-foreground border border-orange-200 dark:border-slate-700'
                      }`}
                    >
                      {message.isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                      ) : (
                        <MarkdownBoundary
                          fallback={<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>}
                          resetKey={`${message.id}:${message.text.length}`}
                        >
                          <ReactMarkdown
                            key={`md-${message.id}-${message.text.length}`}
                            remarkPlugins={[remarkGfm]}
                            className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              a: ({ node, ...props }) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" />
                              )
                            }}
                          >
                            {normalizeMarkdown(message.text)}
                          </ReactMarkdown>
                        </MarkdownBoundary>
                      )}
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
            )}
            <div ref={bottomRef} />
          </ScrollArea>
          
          <div className="p-4 border-t border-orange-200 dark:border-slate-700">
            <div className={`relative rounded-md border border-orange-300 dark:border-slate-600 bg-orange-50 dark:bg-slate-800 px-3 py-2 min-h-[44px] overflow-hidden ${isMultilineInput ? 'flex flex-col gap-2' : ''}`}
            >
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t.chat?.inputPlaceholder}
                rows={1}
                className={`w-full bg-transparent border-0 focus-visible:ring-0 ring-0 focus-visible:ring-offset-0 ring-offset-0 outline-none focus:outline-none shadow-none focus:shadow-none resize-none p-0 leading-6 text-foreground placeholder:text-muted-foreground max-h-40 break-all ${!isMultilineInput ? 'pr-12' : ''}`}
                disabled={isLoading || isStreaming}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  const nextHeight = Math.min(el.scrollHeight, 160);
                  el.style.height = `${nextHeight}px`;
                  try {
                    const cs = window.getComputedStyle(el);
                    const lineHeight = parseFloat(cs.lineHeight || '24');
                    const valueNow = el.value;
                    const lines = Math.max(1, Math.round(nextHeight / lineHeight));
                    const shouldBecomeMulti = lines >= 2;
                    const shouldBecomeSingle = valueNow.trim().length === 0;

                    if (shouldBecomeMulti && !isMultilineInput) {
                      setIsMultilineInput(true);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = 'auto';
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    } else if (shouldBecomeSingle && isMultilineInput) {
                      setIsMultilineInput(false);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = 'auto';
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    }
                  } catch {
                    const valueNow = el.value;
                    const shouldBecomeMulti = nextHeight > 36; // approx >= 2 lines
                    const shouldBecomeSingle = valueNow.trim().length === 0;
                    if (shouldBecomeMulti && !isMultilineInput) {
                      setIsMultilineInput(true);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = 'auto';
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    } else if (shouldBecomeSingle && isMultilineInput) {
                      setIsMultilineInput(false);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = 'auto';
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    }
                  }
                }}
              />
              {!isMultilineInput && (
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || isStreaming}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0 bg-orange-600 hover:bg-orange-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full text-white flex items-center justify-center"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              )}
              {isMultilineInput && (
                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isStreaming}
                    className="h-9 w-9 p-0 bg-orange-600 hover:bg-orange-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full text-white flex items-center justify-center"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWidget;
