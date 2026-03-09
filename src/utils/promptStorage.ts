// LocalStorage-based storage for prompts (persists across sessions)
const STORAGE_KEY = 'agcd_prompts';

interface ProfileWithQueues {
  profileId: string;
  profileName: string;
  queues: string[];
}

export type SelectionMode = 'all' | 'list' | 'except';

// Template state for overflow handling editor
export interface OverflowBranchState {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  selectedConditionIds: string[];
  conditionValues: { [conditionId: string]: string | number };
  overflowConditionExcludeMode: boolean;
  actionId: string;
  actionValue?: string;
}

export interface SelectedVariableState {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

export interface TemplateState {
  branches: OverflowBranchState[];
  selectedContextVars: SelectedVariableState[];
  selectedLWIVars: SelectedVariableState[];
  scenarioId?: string;
}

export type ChannelType = 'Voice' | 'Messaging';

export interface PromptData {
  id: string;
  promptName: string;
  policyBehavior: string;
  selectedProfiles: ProfileWithQueues[];
  selectionMode: SelectionMode;
  selectedTrigger: string;
  status: 'Draft' | 'Active';
  lastModified: string;
  type: string;
  createdAt?: number; // Timestamp for when the playbook was first created
  updatedAt?: number; // Timestamp for when the playbook was last saved (for sorting and "New" tag)
  templateState?: TemplateState; // Stores the template editor state for restoration
  scenarioId?: string; // The scenario/template type used (e.g., 'overflow-conditions-actions')
  selectedQueue?: string; // Selected queue for public preview flow
  isPublicPreview?: boolean; // True if created in "Agentic routing public preview" flow
  selectedChannel?: ChannelType; // Selected channel for public preview flow (Voice or Messaging)
}

// Load from localStorage
const loadFromStorage = (): Map<string, PromptData> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Migrate "Published" status to "Active" for backwards compatibility
      const entries = Object.entries(data).map(([key, value]: [string, any]) => {
        if (value.status === 'Published') {
          value.status = 'Active';
        }
        return [key, value];
      });
      return new Map(entries);
    }
  } catch (error) {
    console.error('Error loading prompts from localStorage:', error);
  }
  return new Map();
};

// Save to localStorage
const saveToStorage = (prompts: Map<string, PromptData>) => {
  try {
    const obj = Object.fromEntries(prompts.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving prompts to localStorage:', error);
  }
};

// Initialize with sample policies only if localStorage is empty
const initializeSamplePolicies = (prompts: Map<string, PromptData>) => {
  if (prompts.size === 0) {
    const samplePolicies: PromptData[] = [
      // Regular "Agentic routing" flow samples
      {
        id: 'sample-1',
        promptName: 'Overflow routing policy',
        policyBehavior: 'For all customers, when no agents are available, route to the overflow queue "General Overflow Queue". For customers where Is VIP Customer is True, route to the overflow queue "VIP Overflow Queue". For all other customers, end the conversation.',
        selectedProfiles: [
          { profileId: 'profile1', profileName: 'Standard Support Profile', queues: ['General Support Queue', 'Chat Support Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-waiting',
        status: 'Active',
        lastModified: 'Feb 21, 2025',
        type: 'Orchestrator',
        scenarioId: 'overflow-conditions-actions',
        isPublicPreview: false
      },
      {
        id: 'sample-2',
        promptName: 'VIP customer routing',
        policyBehavior: 'For all customers, increase the priority score of the conversation by 10 for every 30 seconds increase in wait time. For customers where Is VIP Customer is True, increase the priority score of the conversation by 25 for every 30 seconds increase in wait time. For all other customers, increase priority score by 5.',
        selectedProfiles: [
          { profileId: 'profile2', profileName: 'VIP Customer Profile', queues: ['VIP Support Queue', 'Emergency Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-waiting',
        status: 'Active',
        lastModified: 'Feb 18, 2025',
        type: 'Orchestrator',
        scenarioId: 'wait-time-escalation',
        isPublicPreview: false
      },
      // Public preview flow samples
      {
        id: 'sample-3',
        promptName: 'After hours automated response',
        policyBehavior: 'For all customers, when no agents are available, send a message to customer "Thank you for contacting us. Our business hours are 9 AM to 5 PM. We will respond to your inquiry during the next business day." and then end the conversation.',
        selectedProfiles: [
          { profileId: 'q1', profileName: 'General Support Queue', queues: ['General Support Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-waiting',
        status: 'Draft',
        lastModified: 'Feb 15, 2025',
        type: 'Orchestrator',
        scenarioId: 'overflow-conditions-actions',
        isPublicPreview: true,
        selectedChannel: 'Voice'
      },
      {
        id: 'sample-4',
        promptName: 'Escalate priority on transfer',
        policyBehavior: 'For all customers, increase priority score of conversations by 20. For customers where Is VIP Customer is True, increase priority score of conversations by 50. For all other customers, increase priority score by 10.',
        selectedProfiles: [
          { profileId: 'q6', profileName: 'Chat Support Queue', queues: ['Chat Support Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-transferred',
        status: 'Draft',
        lastModified: 'Feb 10, 2025',
        type: 'Orchestrator',
        scenarioId: 'queue-transfer-escalation',
        isPublicPreview: true,
        selectedChannel: 'Messaging'
      }
    ];

    samplePolicies.forEach(policy => {
      prompts.set(policy.id, policy);
    });
    saveToStorage(prompts);
  }
};

export const savePrompt = (promptId: string, data: PromptData) => {
  const prompts = loadFromStorage();
  const existing = prompts.get(promptId);
  const now = Date.now();
  prompts.set(promptId, {
    ...data,
    lastModified: getTimeAgo(new Date()),
    createdAt: existing?.createdAt || now, // Preserve original createdAt or set new one
    updatedAt: now // Always update to current time on save
  });
  saveToStorage(prompts);
};

export const getPrompt = (promptId: string): PromptData | undefined => {
  const prompts = loadFromStorage();
  return prompts.get(promptId);
};

export const getAllPrompts = (): PromptData[] => {
  const prompts = loadFromStorage();
  initializeSamplePolicies(prompts);
  // Sort by updatedAt (most recently saved first), fall back to createdAt, policies without timestamps go to the end
  return Array.from(prompts.values()).sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt || 0;
    const bTime = b.updatedAt || b.createdAt || 0;
    return bTime - aTime;
  });
};

// Check if a policy is "new" (created within last 24 hours)
export const isNewPolicy = (policy: PromptData): boolean => {
  if (!policy.createdAt) return false;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return (now - policy.createdAt) < oneDayMs;
};

export const deletePrompt = (promptId: string) => {
  const prompts = loadFromStorage();
  prompts.delete(promptId);
  saveToStorage(prompts);
};

export const duplicatePrompt = (promptId: string): string => {
  const prompts = loadFromStorage();
  const original = prompts.get(promptId);
  if (!original) return '';

  const newId = `${promptId}-copy-${Date.now()}`;
  const newPrompt = {
    ...original,
    id: newId,
    promptName: `${original.promptName} (Copy)`,
    status: 'Draft' as const,
    lastModified: 'Just now',
  };

  prompts.set(newId, newPrompt);
  saveToStorage(prompts);
  return newId;
};

// Helper to format date
function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Helper to get time ago string or formatted date
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

// Helper to get profile display text
export const getProfileDisplayText = (prompt: PromptData): string => {
  if (prompt.selectionMode === 'all') {
    return 'All Engagement profiles';
  } else if (prompt.selectionMode === 'list' && prompt.selectedProfiles.length > 0) {
    return prompt.selectedProfiles.map(p => p.profileName).join(', ');
  } else if (prompt.selectionMode === 'except' && prompt.selectedProfiles.length > 0) {
    return `All except: ${prompt.selectedProfiles.map(p => p.profileName).join(', ')}`;
  }
  return 'No profiles';
};
