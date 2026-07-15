export interface Task {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  codeSnippet?: string;
  question: string;
  hint: string;
  correctAnswers: string[]; 
  reward: number;
  solved: boolean;
  type: 'text' | 'choice';
  options?: string[];
  interactiveTool?: 'caesar' | 'hash' | 'none';
}

export interface Tier {
  id: number;
  name: string;
  difficulty: string;
  color: string; 
  textColor: string;
  tasks: Task[];
  heightRange: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  category: string;
  aliases?: string[];
  content: string; 
  interactiveType?: 'caesar' | 'hash';
  formula?: string;
  example?: string;
}

export interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; 
  description: string;
  count: number;
  icon: string;
}

export interface GameState {
  satoshi: number;
  completedTasks: string[]; 
  upgrades: Upgrade[];
  activeTierId: number;
  activeTaskId: string | null;
  towerHeight: number; 
}
