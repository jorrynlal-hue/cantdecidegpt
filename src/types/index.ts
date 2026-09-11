export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'generate' | 'analyze' | 'convert';
}

export interface CodeRequest {
  prompt: string;
  language: string;
  mode: 'generate' | 'explain' | 'debug' | 'refactor';
}

export interface ImageRequest {
  prompt: string;
  style: 'realistic' | 'abstract' | 'digital-art' | 'sketch';
  size: '512x512' | '768x768' | '1024x1024';
}

export interface SummarizeRequest {
  text: string;
  length: 'short' | 'medium' | 'detailed';
}

export interface TranslateRequest {
  text: string;
  from: string;
  to: string;
}

export interface WritingRequest {
  prompt: string;
  type: 'email' | 'blog' | 'essay' | 'creative' | 'business';
  tone: 'professional' | 'casual' | 'formal' | 'creative';
}

export interface AnalyzeRequest {
  text: string;
  type: 'sentiment' | 'entities' | 'keywords' | 'readability';
}

export interface VoiceRequest {
  audioText: string;
  action: 'transcribe' | 'translate' | 'summarize';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  language: string;
  model: string;
}
