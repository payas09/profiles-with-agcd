import type { UserProfile, QueueItem, UserGroup } from './userGroupTypes';

export const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    skills: ['Gold tier', 'Technical Support', 'Escalations'],
    language: ['English', 'Spanish'],
    region: ['EMEA'],
    capacityProfile: ['Voice high priority'],
    intent: ['Billing inquiry', 'Technical issue'],
    presence: 'Available'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    skills: ['Platinum tier', 'Billing'],
    language: ['English'],
    region: ['Austin', 'Dallas'],
    capacityProfile: ['Voice high priority', 'Chat priority'],
    intent: ['Billing inquiry', 'Account management'],
    presence: 'Available'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    skills: ['Gold tier', 'Billing', 'Technical Support'],
    language: ['Spanish', 'English'],
    region: ['Austin'],
    capacityProfile: ['Voice standard'],
    intent: ['Fraud assist', 'Billing inquiry'],
    presence: 'Busy'
  },
  {
    id: '4',
    name: "James O'Connor",
    skills: ['Platinum tier', 'Escalations'],
    language: ['English'],
    region: ['EMEA'],
    capacityProfile: ['Voice high priority'],
    intent: ['Escalation', 'Account management'],
    presence: 'Available'
  },
  {
    id: '5',
    name: 'Priya Patel',
    skills: ['Gold tier', 'Technical Support'],
    language: ['English'],
    region: ['EMEA', 'Austin'],
    capacityProfile: ['Chat priority'],
    intent: ['Technical issue', 'Product inquiry'],
    presence: 'Available'
  },
  {
    id: '6',
    name: 'Carlos Martinez',
    skills: ['Platinum tier', 'Billing', 'Escalations'],
    language: ['Spanish', 'English'],
    region: ['Dallas'],
    capacityProfile: ['Voice high priority'],
    intent: ['Fraud assist', 'Escalation', 'Billing inquiry'],
    presence: 'Available'
  },
  {
    id: '7',
    name: 'Amanda Foster',
    skills: ['Gold tier', 'Billing'],
    language: ['English'],
    region: ['Austin', 'Dallas'],
    capacityProfile: ['Voice standard', 'Chat priority'],
    intent: ['Billing inquiry', 'Account management'],
    presence: 'Busy'
  },
  {
    id: '8',
    name: 'Raj Gupta',
    skills: ['Platinum tier', 'Technical Support', 'Escalations'],
    language: ['English'],
    region: ['EMEA'],
    capacityProfile: ['Voice high priority'],
    intent: ['Technical issue', 'Escalation'],
    presence: 'Available'
  },
  {
    id: '9',
    name: 'Sofia Andersson',
    skills: ['Gold tier', 'Technical Support'],
    language: ['English', 'Spanish'],
    region: ['EMEA'],
    capacityProfile: ['Chat priority'],
    intent: ['Product inquiry', 'Technical issue'],
    presence: 'Available'
  },
  {
    id: '10',
    name: 'David Kim',
    skills: ['Platinum tier', 'Billing'],
    language: ['English'],
    region: ['Dallas'],
    capacityProfile: ['Voice standard'],
    intent: ['Billing inquiry', 'Fraud assist'],
    presence: 'Busy'
  },
  {
    id: '11',
    name: 'Isabella Torres',
    skills: ['Gold tier', 'Escalations'],
    language: ['Spanish'],
    region: ['Austin', 'Dallas'],
    capacityProfile: ['Voice high priority'],
    intent: ['Escalation', 'Account management'],
    presence: 'Available'
  },
  {
    id: '12',
    name: 'Thomas Wright',
    skills: ['Platinum tier', 'Technical Support'],
    language: ['English'],
    region: ['EMEA'],
    capacityProfile: ['Voice high priority', 'Chat priority'],
    intent: ['Technical issue', 'Product inquiry'],
    presence: 'Available'
  },
  {
    id: '13',
    name: 'Maria Santos',
    skills: ['Gold tier', 'Billing', 'Technical Support'],
    language: ['Spanish', 'English'],
    region: ['Dallas'],
    capacityProfile: ['Voice standard'],
    intent: ['Billing inquiry', 'Technical issue'],
    presence: 'Available'
  },
  {
    id: '14',
    name: 'Alex Turner',
    skills: ['Platinum tier', 'Escalations'],
    language: ['English'],
    region: ['Austin'],
    capacityProfile: ['Chat priority'],
    intent: ['Escalation', 'Fraud assist'],
    presence: 'Busy'
  },
  {
    id: '15',
    name: 'Yuki Tanaka',
    skills: ['Gold tier', 'Technical Support', 'Billing'],
    language: ['English'],
    region: ['EMEA', 'Austin'],
    capacityProfile: ['Voice high priority'],
    intent: ['Technical issue', 'Billing inquiry', 'Product inquiry'],
    presence: 'Available'
  }
];

export const MOCK_QUEUES: QueueItem[] = [
  {
    id: 'q1',
    name: 'Premium Support',
    description: 'High-priority customer support for premium tier clients',
    type: 'Voice'
  },
  {
    id: 'q2',
    name: 'Billing Escalations',
    description: 'Complex billing issues requiring senior agent expertise',
    type: 'Voice'
  },
  {
    id: 'q3',
    name: 'Spanish Support',
    description: 'Spanish-language customer support across all issue types',
    type: 'Chat'
  },
  {
    id: 'q4',
    name: 'Tier 1 Chat',
    description: 'General chat support for common inquiries',
    type: 'Chat'
  },
  {
    id: 'q5',
    name: 'After Hours Support',
    description: 'Off-hours customer support queue',
    type: 'Voice'
  },
  {
    id: 'q6',
    name: 'VIP Customers',
    description: 'Dedicated queue for VIP and enterprise customers',
    type: 'Voice'
  },
  {
    id: 'q7',
    name: 'General Inquiries',
    description: 'General customer questions and information requests',
    type: 'Email'
  },
  {
    id: 'q8',
    name: 'Technical Support',
    description: 'Technical troubleshooting and product support',
    type: 'Chat'
  },
  {
    id: 'q9',
    name: 'Account Management',
    description: 'Account setup, changes, and management requests',
    type: 'Messaging'
  },
  {
    id: 'q10',
    name: 'Sales Inquiries',
    description: 'Product information and sales support',
    type: 'Voice'
  },
  {
    id: 'q11',
    name: 'Escalation Team',
    description: 'High-priority escalated issues requiring immediate attention',
    type: 'Voice'
  },
  {
    id: 'q12',
    name: 'Email Support',
    description: 'Email-based customer support and inquiries',
    type: 'Email'
  }
];

export const MOCK_USER_GROUPS: UserGroup[] = [
  // Dynamic groups (existing)
  {
    id: 'ug1',
    name: 'Premium EMEA Support',
    description: 'Platinum tier agents for high-priority EMEA customers',
    type: 'dynamic',
    eligibilityCriteria: 'Users with Skills Platinum tier, Voice high priority capacity profile, region EMEA',
    associatedQueueIds: ['q1', 'q6'],
    lastUpdated: '2024-12-12T10:30:00Z'
  },
  {
    id: 'ug2',
    name: 'Spanish Language Specialists',
    description: 'Bilingual support agents for Spanish-speaking customers',
    type: 'dynamic',
    eligibilityCriteria: 'Users with Spanish language',
    associatedQueueIds: ['q3'],
    lastUpdated: '2024-12-28T14:45:00Z'
  },
  {
    id: 'ug3',
    name: 'Technical Escalation Team',
    description: 'Senior technical support for complex issues',
    type: 'dynamic',
    eligibilityCriteria: 'Users with Skills Platinum tier or Gold tier, Skills Technical Support or Escalations',
    associatedQueueIds: ['q8', 'q11'],
    lastUpdated: '2025-01-06T09:15:00Z'
  },
  {
    id: 'ug4',
    name: 'US Regional Support',
    description: 'Support team covering Austin and Dallas regions',
    type: 'dynamic',
    eligibilityCriteria: 'Users support Austin or Dallas region',
    associatedQueueIds: ['q4', 'q7'],
    lastUpdated: '2025-01-18T16:20:00Z'
  },
  // Static groups (new)
  {
    id: 'ug5',
    name: 'VIP Account Handlers',
    description: 'Hand-picked agents for VIP customer accounts',
    type: 'static',
    memberUserIds: ['2', '4', '6', '8'],  // Marcus, James, Carlos, Raj
    associatedQueueIds: ['q6'],
    lastUpdated: '2025-02-10T11:00:00Z'
  },
  {
    id: 'ug6',
    name: 'Fraud Response Team',
    description: 'Selected agents trained for fraud investigation',
    type: 'static',
    memberUserIds: ['3', '6', '10', '14'],  // Elena, Carlos, David, Alex
    associatedQueueIds: ['q2', 'q11'],
    lastUpdated: '2025-02-15T09:30:00Z'
  }
];
