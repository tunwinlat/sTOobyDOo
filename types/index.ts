export interface Family {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isSetupComplete: boolean;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface List {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface ListShare {
  id: string;
  listId: string;
  memberId: string;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  member?: FamilyMember;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  dueDate: string | null;
  dueTime: string | null;
  reminderAt: string | null;
  reminderSent?: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string | null;
  parentId: string | null;
  createdBy?: FamilyMember;
  assignedTo?: FamilyMember | null;
  subtasks?: Task[];
  list?: List;
}

export interface McpToken {
  id: string;
  familyId: string;
  memberId: string;
  name: string;
  token: string;
  allowAllLists: boolean;
  canCreateTasks: boolean;
  canCompleteTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canCreateLists: boolean;
  canEditLists: boolean;
  canDeleteLists: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  listAccess?: { list: List }[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
