export interface DocMeta {
  name: string;
  ext: string;
  size: number;
  chars: number;
  updated: number;
  status: 'ok' | 'low' | 'empty' | 'unsupported';
  excerpt: string;
}

export interface DocRecord extends DocMeta {
  text: string;
}

export interface GenerateInput {
  brief: string;
}

export interface PostResult {
  text: string;
  provider: string;
  isBaseline: boolean;
  words: number;
  chars: number;
}

export interface FlowNode {
  id: string;
  label: string;
  q: string;
  detail: string;
  x: number;
  y: number;
  kind: string;
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  title: string;
}

export interface Profile {
  brief: string;
  updatedAt: number;
}

export interface KnowledgeView {
  docs: DocMeta[];
  builtAt: number;
  stats: { totalChars: number; totalDocs: number; lowConfidence: number };
  summary: string;
  facts: string[];
  profile: Profile | null;
  flow: FlowGraph;
}

export interface LibraryPost {
  id: string;
  createdAt: number;
  text: string;
  meta: { product: string; tone: string; hook: string; length: string };
}