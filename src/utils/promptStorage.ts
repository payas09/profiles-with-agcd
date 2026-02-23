// LocalStorage-based storage for prompts (persists across sessions)
const STORAGE_KEY = 'agcd_prompts';

interface ProfileWithQueues {
  profileId: string;
  profileName: string;
  queues: string[];
}

export type SelectionMode = 'all' | 'list' | 'except';

export interface PromptData {
  id: string;
  promptName: string;
  policyBehavior: string;
  selectedProfiles: ProfileWithQueues[];
  selectionMode: SelectionMode;
  selectedTrigger: string;
  status: 'Draft' | 'Published';
  lastModified: string;
  type: string;
  createdAt?: number; // Timestamp for sorting and "New" tag
}

// Load from localStorage
const loadFromStorage = (): Map<string, PromptData> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
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
      {
        id: 'sample-1',
        promptName: 'Overflow routing policy',
        policyBehavior: 'If queue wait time is greater than 5 minutes, then route to available overflow queue. Communicate with customer whenever overflow is triggered.',
        selectedProfiles: [
          { profileId: 'profile1', profileName: 'Standard Support Profile', queues: ['General Support Queue', 'Chat Support Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-waiting',
        status: 'Published',
        lastModified: 'Feb 21, 2025',
        type: 'Orchestrator'
      },
      {
        id: 'sample-2',
        promptName: 'VIP customer routing',
        policyBehavior: 'Route VIP customers to available VIP agents immediately. If no VIP agents available, escalate to supervisor queue.',
        selectedProfiles: [
          { profileId: 'profile2', profileName: 'VIP Customer Profile', queues: ['VIP Support Queue', 'Emergency Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-waiting',
        status: 'Published',
        lastModified: 'Feb 18, 2025',
        type: 'Assignment'
      },
      {
        id: 'sample-3',
        promptName: 'After hours automated response',
        policyBehavior: 'Send automated message to customers during after hours. Inform about business hours and expected response time.',
        selectedProfiles: [],
        selectionMode: 'all',
        selectedTrigger: 'conversation-waiting',
        status: 'Draft',
        lastModified: 'Feb 15, 2025',
        type: 'Orchestrator'
      },
      {
        id: 'sample-4',
        promptName: 'Prioritize for technical issues',
        policyBehavior: 'Prioritize work items with technical issues and route to specialist agents first.',
        selectedProfiles: [
          { profileId: 'profile3', profileName: 'Technical Support Profile', queues: ['Technical Support Queue'] }
        ],
        selectionMode: 'list',
        selectedTrigger: 'conversation-transferred',
        status: 'Draft',
        lastModified: 'Feb 10, 2025',
        type: 'Assignment'
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
    createdAt: existing?.createdAt || now // Preserve original createdAt or set new one
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
  // Sort by createdAt (newest first), policies without createdAt go to the end
  return Array.from(prompts.values()).sort((a, b) => {
    const aTime = a.createdAt || 0;
    const bTime = b.createdAt || 0;
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
