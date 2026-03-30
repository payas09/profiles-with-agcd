export interface UserProfile {
  id: string;
  name: string;
  skills: string[];
  language: string[];
  region: string[];
  capacityProfile: string[];
  intent: string[];
  presence: 'Available' | 'Busy';
}

export interface QueueItem {
  id: string;
  name: string;
  description: string;
  type: 'Voice' | 'Chat' | 'Email' | 'Messaging' | 'Record';
}

export type UserGroupType = 'static' | 'dynamic';

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  type: UserGroupType;
  eligibilityCriteria?: string;  // For dynamic groups
  memberUserIds?: string[];      // For static groups
  associatedQueueIds: string[];
  lastUpdated: string;
}

// Hierarchical tree node structure
export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

// Flat filter options (non-hierarchical)
export const FLAT_FILTER_OPTIONS = {
  skills: ['Gold tier', 'Platinum tier', 'Technical Support', 'Escalations', 'Billing'],
  capacityProfile: ['Voice high priority', 'Voice standard', 'Chat priority'],
  intent: ['Billing inquiry', 'Technical issue', 'Account management', 'Escalation', 'Fraud assist', 'Product inquiry']
} as const;

// Hierarchical filter options
export const HIERARCHICAL_FILTERS: Record<string, TreeNode[]> = {
  language: [
    {
      id: 'european',
      label: 'European Languages',
      children: [
        {
          id: 'western-european',
          label: 'Western European',
          children: [
            { id: 'English', label: 'English' },
            { id: 'French', label: 'French' },
            { id: 'German', label: 'German' },
            { id: 'Dutch', label: 'Dutch' },
            { id: 'Portuguese', label: 'Portuguese' }
          ]
        },
        {
          id: 'southern-european',
          label: 'Southern European',
          children: [
            { id: 'Spanish', label: 'Spanish' },
            { id: 'Italian', label: 'Italian' },
            { id: 'Greek', label: 'Greek' }
          ]
        },
        {
          id: 'eastern-european',
          label: 'Eastern European',
          children: [
            { id: 'Russian', label: 'Russian' },
            { id: 'Polish', label: 'Polish' },
            { id: 'Czech', label: 'Czech' }
          ]
        }
      ]
    },
    {
      id: 'asian',
      label: 'Asian Languages',
      children: [
        {
          id: 'east-asian',
          label: 'East Asian',
          children: [
            { id: 'Mandarin', label: 'Mandarin' },
            { id: 'Cantonese', label: 'Cantonese' },
            { id: 'Japanese', label: 'Japanese' },
            { id: 'Korean', label: 'Korean' }
          ]
        },
        {
          id: 'south-asian',
          label: 'South Asian',
          children: [
            { id: 'Hindi', label: 'Hindi' },
            { id: 'Tamil', label: 'Tamil' },
            { id: 'Bengali', label: 'Bengali' }
          ]
        },
        {
          id: 'southeast-asian',
          label: 'Southeast Asian',
          children: [
            { id: 'Thai', label: 'Thai' },
            { id: 'Vietnamese', label: 'Vietnamese' },
            { id: 'Indonesian', label: 'Indonesian' }
          ]
        }
      ]
    },
    {
      id: 'middle-eastern',
      label: 'Middle Eastern Languages',
      children: [
        {
          id: 'semitic',
          label: 'Semitic',
          children: [
            { id: 'Arabic', label: 'Arabic' },
            { id: 'Hebrew', label: 'Hebrew' }
          ]
        },
        {
          id: 'iranian',
          label: 'Iranian',
          children: [
            { id: 'Persian', label: 'Persian' },
            { id: 'Turkish', label: 'Turkish' }
          ]
        }
      ]
    }
  ],
  region: [
    {
      id: 'americas',
      label: 'Americas',
      children: [
        {
          id: 'north-america',
          label: 'North America',
          children: [
            {
              id: 'usa',
              label: 'United States',
              children: [
                { id: 'Austin', label: 'Austin' },
                { id: 'Dallas', label: 'Dallas' },
                { id: 'New York', label: 'New York' }
              ]
            },
            { id: 'Canada', label: 'Canada' }
          ]
        },
        {
          id: 'south-america',
          label: 'South America',
          children: [
            { id: 'Brazil', label: 'Brazil' },
            { id: 'Argentina', label: 'Argentina' }
          ]
        }
      ]
    },
    {
      id: 'emea',
      label: 'EMEA',
      children: [
        {
          id: 'europe',
          label: 'Europe',
          children: [
            { id: 'UK', label: 'United Kingdom' },
            { id: 'Germany', label: 'Germany' },
            { id: 'France', label: 'France' }
          ]
        },
        {
          id: 'middle-east',
          label: 'Middle East',
          children: [
            { id: 'UAE', label: 'UAE' },
            { id: 'Saudi Arabia', label: 'Saudi Arabia' }
          ]
        }
      ]
    },
    {
      id: 'apac',
      label: 'APAC',
      children: [
        { id: 'Australia', label: 'Australia' },
        { id: 'Singapore', label: 'Singapore' },
        { id: 'India', label: 'India' }
      ]
    }
  ]
};

// Legacy flat options for backward compatibility
export const FILTER_OPTIONS = {
  skills: FLAT_FILTER_OPTIONS.skills,
  language: ['English', 'Spanish'],
  region: ['EMEA', 'Austin', 'Dallas'],
  capacityProfile: FLAT_FILTER_OPTIONS.capacityProfile,
  intent: FLAT_FILTER_OPTIONS.intent
} as const;

export interface EligibilityCriteria {
  skills?: string[];
  language?: string[];
  region?: string[];
  capacityProfile?: string[];
  intent?: string[];
}
