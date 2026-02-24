
export enum Department {
  GENERAL = 'General',
  FINANCE = 'Finance',
  ACCOUNTING = 'Accounting',
  CREATIVE = 'Creative',
  DEVELOPMENT = 'Development',
  MARKETING = 'Marketing',
  WIX = 'Wix',
  INVENTOR = 'Inventor'
}

export interface BotMetadata {
  id: Department;
  name: string;
  description: string;
  icon: string;
  color: string;
  avatarUrl?: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Assignee {
  id: string;
  name: string;
  avatarLabel: string;
  color: string;
  avatarUrl?: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
  url?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  department: Department;
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  createdAt: number;
  prerequisiteIds?: string[];
  estimatedTime?: number;
  actualTime?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  department: Department;
  timestamp: number;
  attachments?: Attachment[];
  groundingUrls?: { title: string; uri: string }[];
}

export interface Invoice {
  id: string;
  source: string;
  amount: number;
  currency: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

export interface Order {
  id: string;
  source: string;
  item: string;
  vendor: string;
  date: string;
  status: 'shipped' | 'processing' | 'delivered';
}

export type ViewMode = 'chat' | 'tasks' | 'integrations' | 'live' | 'analytics';

export interface AppState {
  currentDepartment: Department;
  messages: Message[];
  tasks: Task[];
  isTyping: boolean;
  viewMode: ViewMode;
  isLiveActive: boolean;
}
