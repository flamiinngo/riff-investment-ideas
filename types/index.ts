export type Allocation = {
  symbol: string;
  company: string;
  weight: number;
  available: boolean;
};

export type LineageNode = {
  id: string;
  name: string;
  creator: string;
};

export type Idea = {
  id: string;
  name: string;
  description: string;
  thesis: string;
  creator: string;
  creatorName: string;
  createdAt: string;
  performance: number;
  capital: number;
  holders: number;
  remixes: number;
  category: string;
  allocation: Allocation[];
  sparkline: number[];
  lineage: LineageNode[];
  version: number;
  parentIdeaId?: string;
};

export type TransactionState = 'idle' | 'review' | 'quoting' | 'confirming' | 'confirmed' | 'failed';
