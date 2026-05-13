import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ServiceOperationsAgent.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConversationState =
  | 'welcome'
  | 'chatting'
  | 'rtq_awaiting_rule2'
  | 'rtq_awaiting_queue_clarify'
  | 'rtq_complete';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'adaptive-card' | 'rtq-success' | 'quick-suggestions';
  adaptiveCardData?: AdaptiveCardData;
  suggestions?: string[];
}

interface AdaptiveCardData {
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
}

interface RTQRule {
  name: string;
  queue: string;
}

interface RTQData {
  workstreamName: string;
  rulesetName: string;
  rules: RTQRule[];
}

// ─── Config Card Data ─────────────────────────────────────────────────────────

interface ConfigCard {
  id: string;
  title: string;
  fieldsLabel: string;
  totalFields: number;
  completedFields: number;
  required?: boolean;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  subitems?: string[];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5zM1.6 9.3l.9.2a5.5 5.5 0 0 0 .6 1.4l-.5.7a.8.8 0 0 0 .1 1l.8.8a.8.8 0 0 0 1 .1l.7-.5c.4.3.9.5 1.4.6l.2.9a.8.8 0 0 0 .8.6h1.2a.8.8 0 0 0 .8-.6l.2-.9c.5-.1 1-.3 1.4-.6l.7.5a.8.8 0 0 0 1-.1l.8-.8a.8.8 0 0 0 .1-1l-.5-.7c.3-.4.5-.9.6-1.4l.9-.2A.8.8 0 0 0 15 8.5V7.3a.8.8 0 0 0-.6-.8l-.9-.2a5.5 5.5 0 0 0-.6-1.4l.5-.7a.8.8 0 0 0-.1-1l-.8-.8a.8.8 0 0 0-1-.1l-.7.5A5.5 5.5 0 0 0 9.3 2.3L9.1 1.4A.8.8 0 0 0 8.3.8H7.1a.8.8 0 0 0-.8.6l-.2.9A5.5 5.5 0 0 0 4.7 2.9l-.7-.5a.8.8 0 0 0-1 .1L2.2 3.3a.8.8 0 0 0-.1 1l.5.7a5.5 5.5 0 0 0-.6 1.4l-.9.2A.8.8 0 0 0 .5 7.4v1.2a.8.8 0 0 0 .6.8l.5-.1z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm.5 2H7.5v4l3 1.8.5-.9-2.5-1.5V5z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.4 1.3C3 .9 2.4.9 2 1.3L.7 2.6C.1 3.2 0 4 .3 4.8 1.1 6.8 2.5 8.9 4.4 10.8c1.9 1.9 4 3.3 6 4.1.8.3 1.6.2 2.2-.4l1.3-1.3c.4-.4.4-1 0-1.4L11.4 9c-.4-.4-1-.4-1.4 0l-.9.9C8.2 9.5 7 8.8 6 7.9 5 6.9 4.3 5.7 3.9 4.7l.9-.9c.4-.4.4-1 0-1.4L3.4 1.3z" />
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4l2 3 2-3h4a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
  </svg>
);

const QueueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="4" r="2" />
    <circle cx="5" cy="10" r="2" />
    <path d="M9 3h5M9 5h5M9 9h5M9 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WorkstreamIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 8 a3 3 0 1 0 4 0 M10 8 a3 3 0 1 0 4 0 M6 8 h4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="6" cy="5" r="2" />
    <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    <circle cx="11" cy="5" r="1.5" />
    <path d="M11 9c1.7 0 3 1.1 3 3" />
  </svg>
);

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="6" cy="9" r="1" />
    <circle cx="10" cy="9" r="1" />
    <path d="M8 5V3M6 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.5 2H5a3 3 0 0 0 0 6h1.5M8.5 14H11a3 3 0 0 0 0-6H9.5M5 8h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SendIconSVG = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15 8L1 1l3 7-3 7 14-7z" />
  </svg>
);

const SubitemIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 8 a3 3 0 1 0 4 0" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 8 a3 3 0 1 0 4 0" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
  </svg>
);

const ThumbUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9 1L7 7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h9.3l1.7-6.5V7a1 1 0 0 0-1-1H9V1z" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7 15l2-6h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3.7L2 8.5V9a1 1 0 0 0 1 1h4v5z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="4" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const InfoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Config Cards Data ────────────────────────────────────────────────────────

const buildConfigCards = (): ConfigCard[] => [
  {
    id: 'project-env',
    title: 'Project & Environment',
    fieldsLabel: '7 fields',
    totalFields: 7,
    completedFields: 3,
    required: true,
    iconBg: '#ede8f5',
    iconColor: '#7e5eb5',
    icon: <GearIcon />,
  },
  {
    id: 'operating-hours',
    title: 'Operating Hours',
    fieldsLabel: '4 fields',
    totalFields: 4,
    completedFields: 2,
    iconBg: '#fff4e0',
    iconColor: '#f7a700',
    icon: <ClockIcon />,
  },
  {
    id: 'voice-channel',
    title: 'Voice Channel',
    fieldsLabel: '8 fields',
    totalFields: 8,
    completedFields: 4,
    required: true,
    iconBg: '#e8f5e8',
    iconColor: '#107c10',
    icon: <PhoneIcon />,
  },
  {
    id: 'chat-channel',
    title: 'Chat Channel',
    fieldsLabel: '7 fields · optional',
    totalFields: 7,
    completedFields: 2,
    iconBg: '#e8f0fd',
    iconColor: '#0078d4',
    icon: <ChatIcon />,
  },
  {
    id: 'queues',
    title: 'Queues',
    fieldsLabel: '5 fields per queue',
    totalFields: 5,
    completedFields: 5,
    required: true,
    iconBg: '#fce8f0',
    iconColor: '#c4285a',
    icon: <QueueIcon />,
    subitems: ['Tier 1 Support', 'Tier 2 Escalation'],
  },
  {
    id: 'workstreams-routing',
    title: 'Workstreams & Routing',
    fieldsLabel: '7+ fields per workstream',
    totalFields: 7,
    completedFields: 2,
    iconBg: '#fff4d4',
    iconColor: '#d18700',
    icon: <WorkstreamIcon />,
    subitems: ['Voice Workstream', 'Chat Workstream'],
  },
  {
    id: 'users-capacity',
    title: 'Users & Capacity',
    fieldsLabel: '5 fields + capacity profile',
    totalFields: 5,
    completedFields: 3,
    iconBg: '#e8f5e8',
    iconColor: '#107c10',
    icon: <UsersIcon />,
    subitems: ['Agent 1', 'Agent 2', 'Supervisor 1'],
  },
  {
    id: 'agent-handoff',
    title: 'Agent Handoff: Bot / IVR',
    fieldsLabel: '4 fields',
    totalFields: 4,
    completedFields: 1,
    iconBg: '#e8eef8',
    iconColor: '#4a6da7',
    icon: <BotIcon />,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRTQPrompt(text: string): Partial<RTQData> {
  const wsMatch = text.match(/workstream\s+([^\s,]+)/i);
  const rsMatch = text.match(/ruleset\s+(?:name\s+)?([^\s,]+)/i);
  // Match capitalized "Queue Q1" pattern - avoids matching lowercase "route to queue rules"
  // Case-sensitive: "Queue" (capitalized) is a named queue reference, "queue" (lower) is the concept
  const q1Match = text.match(/\bQueue\s+([\w\d]+)/) || text.match(/to\s+queue\s+(Q[\w\d]+)/i);
  return {
    workstreamName: wsMatch ? wsMatch[1] : 'Voice Workstream',
    rulesetName: rsMatch ? rsMatch[1] : 'RTQ Ruleset',
    rules: q1Match ? [{ name: 'Rule 1', queue: q1Match[1] }] : [{ name: 'Rule 1', queue: 'Q1' }],
  };
}

function isRTQRequest(text: string): boolean {
  return /route.to.queue|rtq|routing rule/i.test(text);
}

let msgCounter = 0;
function newId() {
  return `msg-${++msgCounter}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ServiceOperationsAgent: React.FC = () => {
  const location = useLocation();
  const locationState = location.state as { initialMessage?: string; mode?: string } | null;

  const [conversationState, setConversationState] = useState<ConversationState>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'blueprint' | 'simulation'>('setup');
  const [rtqData, setRtqData] = useState<RTQData | null>(null);
  const [configCards, setConfigCards] = useState<ConfigCard[]>(buildConfigCards());
  const [adaptiveCardValues, setAdaptiveCardValues] = useState<Record<string, string>>({});
  const [pendingRTQPartial, setPendingRTQPartial] = useState<Partial<RTQData> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial message from Home page navigation
  useEffect(() => {
    if (locationState?.initialMessage) {
      handleUserMessage(locationState.initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: newId() }]);
  };

  const handleUserMessage = (text: string) => {
    if (!text.trim()) return;

    addMessage({ role: 'user', content: text });
    setInputValue('');

    if (conversationState === 'welcome' || conversationState === 'chatting') {
      if (isRTQRequest(text)) {
        handleRTQFlow(text);
      } else {
        // Generic agent response
        setConversationState('chatting');
        setTimeout(() => {
          addMessage({
            role: 'agent',
            content: "I understand you'd like to set up your contact center. I can help you configure route-to-queue rules, workstreams, queues, and more. What would you like to configure?",
            type: 'text',
          });
          addMessage({
            role: 'agent',
            content: '',
            type: 'quick-suggestions',
            suggestions: [
              'Setup route to queue rules',
              'Configure a workstream',
              'Create a queue',
            ],
          });
        }, 600);
      }
    } else if (conversationState === 'rtq_awaiting_rule2') {
      handleRule2Response(text);
    } else if (conversationState === 'rtq_awaiting_queue_clarify') {
      handleQueueClarify(text);
    }
  };

  const handleRTQFlow = (text: string) => {
    const partial = parseRTQPrompt(text);
    setPendingRTQPartial(partial);

    // Highlight the Workstreams & Routing card
    setSelectedCardId('workstreams-routing');
    setConversationState('rtq_awaiting_rule2');

    setTimeout(() => {
      addMessage({
        role: 'agent',
        content: "Sure, I'll help you set up the route-to-queue rules. Let me update **Workstreams & Routing** for you.",
      });
    }, 500);

    setTimeout(() => {
      const rule2AdaptiveId = newId();
      setMessages(prev => [
        ...prev,
        {
          id: rule2AdaptiveId,
          role: 'agent',
          content: '',
          type: 'adaptive-card',
          adaptiveCardData: {
            title: 'Can you provide details about the 2nd RTQ rule? What would be the rule name and what would be the output Queue?',
            placeholder: 'Enter rule name and queue (e.g. Rule 2 → Queue2)',
            onSubmit: () => {},
          },
        } as Message,
      ]);
      addMessage({
        role: 'agent',
        content: '',
        type: 'quick-suggestions',
        suggestions: ['What are routing rules?', 'Can you give me an example routing rule?'],
      });
    }, 1100);
  };

  const handleRule2Response = (text: string) => {
    // Check if the response is too vague (single word like "Queue" or just a queue name without a rule name)
    const isVague = /^queue$/i.test(text.trim()) || text.trim().split(/\s+/).length <= 1;

    if (isVague) {
      setConversationState('rtq_awaiting_queue_clarify');
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: "Sorry I didn't get that. Can you provide the name of an existing queue for the 2nd RTQ rule or do you want to create a new one?",
        });
      }, 500);
    } else {
      completeRTQSetup(text);
    }
  };

  const handleQueueClarify = (text: string) => {
    completeRTQSetup(text);
  };

  const completeRTQSetup = (rule2Input: string) => {
    // Parse rule 2 info - extract rule name and queue name separately
    const ruleNameMatch = rule2Input.match(/rule\s*(\d+\w*)/i);
    const ruleName = ruleNameMatch ? `Rule ${ruleNameMatch[1]}` : 'Rule 2';
    // Try to find "Queue<name>" or "queue <name>" at the end, or "existing queue <name>"
    const queueMatch =
      rule2Input.match(/existing\s+queue\s+([\w\d]+)/i) ||
      rule2Input.match(/Queue\s+([\w\d]+)\s*$/i) ||
      rule2Input.match(/queue\s+([\w\d]+)/i);
    const queueName = queueMatch ? queueMatch[1] : 'Queue2';

    const partial = pendingRTQPartial || {};
    const finalRTQ: RTQData = {
      workstreamName: partial.workstreamName || 'Voice Workstream',
      rulesetName: partial.rulesetName || 'RTQ Ruleset 1',
      rules: [
        ...(partial.rules || [{ name: 'Rule 1', queue: 'Q1' }]),
        { name: ruleName, queue: queueName.trim() },
      ],
    };

    setRtqData(finalRTQ);
    setConversationState('rtq_complete');

    // Update the Workstreams & Routing card to reflect completion
    setConfigCards(prev =>
      prev.map(c =>
        c.id === 'workstreams-routing'
          ? { ...c, completedFields: 6, subitems: [finalRTQ.workstreamName] }
          : c,
      ),
    );

    setTimeout(() => {
      addMessage({ role: 'agent', content: 'OK, let me proceed.' });
    }, 400);

    setTimeout(() => {
      addMessage({
        role: 'agent',
        content: '',
        type: 'rtq-success',
      });
    }, 1200);
  };

  const handleChoiceCard = (mode: string) => {
    setConversationState('chatting');
    if (mode === 'upload') {
      addMessage({
        role: 'user',
        content: 'Upload requirements docs',
      });
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: "Please upload your requirements document and I'll extract the configurations for you.",
        });
      }, 500);
    } else if (mode === 'guide') {
      addMessage({ role: 'user', content: 'Guide me through setup' });
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: "I'll walk you through each configuration step by step. Let's start with your Project & Environment settings. What's the name of your organization?",
        });
      }, 500);
    } else if (mode === 'template') {
      addMessage({ role: 'user', content: 'Quick setup from industry template' });
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: 'Which industry best describes your contact center? For example: Financial Services, Healthcare, Retail, or Technology.',
        });
      }, 500);
    }
  };

  const handleSkip = () => {
    setConversationState('chatting');
    addMessage({ role: 'user', content: 'Skip and ask me questions' });
    setTimeout(() => {
      addMessage({
        role: 'agent',
        content: "Sure! I'm here to help. What would you like to configure or ask about?",
      });
    }, 400);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleUserMessage(suggestion);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage(inputValue);
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.type === 'rtq-success' && rtqData) {
      return (
        <div className="soa-rtq-success">
          <strong>Route-to-queue rules configured!</strong>
          <br />
          <br />
          Created ruleset <strong>{rtqData.rulesetName}</strong> in workstream{' '}
          <strong>{rtqData.workstreamName}</strong> with {rtqData.rules.length} rules.
          <br />
          <br />
          <a
            href="#"
            className="soa-rtq-link"
            onClick={e => {
              e.preventDefault();
              setSelectedCardId('workstreams-routing');
            }}
          >
            View in Workstreams & Routing →
          </a>
        </div>
      );
    }

    if (msg.type === 'quick-suggestions' && msg.suggestions) {
      return (
        <div className="soa-quick-suggestions">
          {msg.suggestions.map(s => (
            <button key={s} className="soa-quick-suggestion" onClick={() => handleSuggestionClick(s)}>
              {s}
            </button>
          ))}
        </div>
      );
    }

    if (msg.type === 'adaptive-card' && msg.adaptiveCardData) {
      const cardId = msg.id;
      return (
        <div className="soa-adaptive-card">
          <p className="soa-adaptive-card-title">{msg.adaptiveCardData.title}</p>
          <input
            className="soa-adaptive-card-input"
            placeholder={msg.adaptiveCardData.placeholder}
            value={adaptiveCardValues[cardId] || ''}
            onChange={e =>
              setAdaptiveCardValues(prev => ({ ...prev, [cardId]: e.target.value }))
            }
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = adaptiveCardValues[cardId] || '';
                if (val.trim()) {
                  handleUserMessage(val);
                  setAdaptiveCardValues(prev => ({ ...prev, [cardId]: '' }));
                }
              }
            }}
          />
          <button
            className="soa-adaptive-card-submit"
            onClick={() => {
              const val = adaptiveCardValues[cardId] || '';
              if (val.trim()) {
                handleUserMessage(val);
                setAdaptiveCardValues(prev => ({ ...prev, [cardId]: '' }));
              }
            }}
          >
            Submit
          </button>
        </div>
      );
    }

    // Render simple bold/italic markdown
    const formatted = msg.content
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

    return <span>{formatted}</span>;
  };

  // ─── Setup Visual Cards Rendering ──────────────────────────────────────────

  const renderConfigCard = (card: ConfigCard) => {
    const pct = Math.round((card.completedFields / card.totalFields) * 100);
    const isComplete = card.completedFields >= card.totalFields;
    const isSelected = selectedCardId === card.id;

    return (
      <div
        key={card.id}
        className={`soa-config-card${isSelected ? ' highlighted' : ''}`}
        onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
      >
        <div className="soa-config-card-header">
          <div className="soa-config-card-left">
            <div
              className="soa-config-card-icon"
              style={{ background: card.iconBg, color: card.iconColor }}
            >
              {card.icon}
            </div>
            <div className="soa-config-card-info">
              <h4>{card.title}</h4>
              <div className="fields">{card.fieldsLabel}</div>
            </div>
          </div>
          <div className="soa-config-card-right">
            {card.required && <span className="soa-required-badge">Required</span>}
            <span className="soa-info-icon"><InfoIcon /></span>
          </div>
        </div>

        <div className="soa-config-progress">
          <div
            className={`soa-config-progress-bar ${isComplete ? 'complete' : 'partial'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="soa-config-progress-label">
          <span style={{ color: isComplete ? '#107c10' : '#f7a700' }}>
            ● {card.completedFields}/{card.totalFields}
          </span>
        </div>

        {card.subitems && card.subitems.length > 0 && (
          <div className="soa-config-subitems">
            {card.subitems.map(sub => (
              <div key={sub} className="soa-config-subitem">
                {card.id === 'queues' ? <QueueIcon /> : card.id === 'users-capacity' ? <PersonIcon /> : <SubitemIcon />}
                {sub}
              </div>
            ))}
            {(card.id === 'queues') && (
              <div className="soa-config-subitem">
                <button className="soa-config-add-btn">+</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Right Detail Panel ────────────────────────────────────────────────────

  const renderDetailPanel = () => {
    if (!selectedCardId) return null;
    const card = configCards.find(c => c.id === selectedCardId);
    if (!card) return null;

    const isWorkstreams = selectedCardId === 'workstreams-routing';

    return (
      <div className="soa-detail-panel">
        <div className="soa-detail-panel-header">
          <div>
            <div className="soa-detail-panel-title-row">
              <div
                className="soa-config-card-icon"
                style={{ background: card.iconBg, color: card.iconColor, width: 22, height: 22 }}
              >
                {card.icon}
              </div>
              <span className="soa-detail-panel-title">{card.title}</span>
            </div>
            <div className="soa-detail-panel-subtitle">{card.fieldsLabel}</div>
          </div>
          <button className="soa-detail-close" onClick={() => setSelectedCardId(null)}>
            <CloseIcon />
          </button>
        </div>

        <div className="soa-detail-content">
          {isWorkstreams ? (
            <table className="soa-detail-table">
              <tbody>
                <tr>
                  <td>Workstream name</td>
                  <td>{rtqData?.workstreamName || 'Voice Workstream'}</td>
                </tr>
                <tr>
                  <td>Channel</td>
                  <td>Voice</td>
                </tr>
                <tr>
                  <td>Work distribution mode</td>
                  <td>Push</td>
                </tr>
                <tr>
                  <td>Default queue</td>
                  <td className="soa-detail-placeholder">Select an option</td>
                </tr>
                <tr>
                  <td>Allowed presences</td>
                  <td>Available, Busy</td>
                </tr>
                {rtqData ? (
                  <tr>
                    <td>Route to queue rules</td>
                    <td>
                      <div className="soa-rtq-section">
                        <div className="soa-rtq-section-title">Route to queue rules</div>
                        <div className="soa-rtq-ruleset">
                          <div className="soa-rtq-ruleset-name">
                            📋 {rtqData.rulesetName}
                          </div>
                          {rtqData.rules.map((rule, i) => (
                            <div key={i} className="soa-rtq-rule">
                              <span>{rule.name}</span>
                              <span className="soa-rtq-rule-arrow">→</span>
                              <span className="soa-rtq-rule-queue">{rule.queue}</span>
                            </div>
                          ))}
                        </div>
                        <a href="#" className="soa-rtq-hyperlink">
                          <LinkIcon />
                          Open Workstream › Ruleset page
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td>Routing rules</td>
                    <td className="soa-detail-placeholder">Enter text</td>
                  </tr>
                )}
                <tr>
                  <td>Default rule</td>
                  <td className="soa-detail-placeholder">Yes / No</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="soa-detail-table">
              <tbody>
                <tr>
                  <td>Configuration</td>
                  <td>Value</td>
                </tr>
                {card.subitems?.map(item => (
                  <tr key={item}>
                    <td>{item}</td>
                    <td className="soa-detail-placeholder">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="soa-page">
      {/* ── Left: Chat Panel ── */}
      <div className="soa-chat-panel">
        <div className="soa-chat-panel-header">
          <div className="soa-agent-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="6" width="14" height="11" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="7.5" cy="11" r="1.5" fill="white" />
              <circle cx="12.5" cy="11" r="1.5" fill="white" />
              <path d="M10 6V4M8 4h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="soa-chat-panel-title">Service Operations Agent (preview)</span>
        </div>

        <div className="soa-chat-messages">
          {conversationState === 'welcome' ? (
            <div className="soa-welcome-container">
              <div className="soa-welcome-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="8" width="20" height="16" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
                  <circle cx="10" cy="15" r="2" fill="white" />
                  <circle cx="18" cy="15" r="2" fill="white" />
                  <path d="M14 8V5M11 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="soa-welcome-label">Welcome to Service Operations Agent</div>

              <p className="soa-welcome-msg">
                I can help you set up your contact center. Choose how you'd like to get started:
              </p>

              <div className="soa-choice-cards">
                <button className="soa-choice-card" onClick={() => handleChoiceCard('upload')}>
                  <p className="soa-choice-card-title">Upload requirements docs</p>
                  <p className="soa-choice-card-desc">
                    Upload a requirements document or transcript and I'll extract your configurations.
                  </p>
                </button>
                <button className="soa-choice-card" onClick={() => handleChoiceCard('guide')}>
                  <p className="soa-choice-card-title">Guide me through setup</p>
                  <p className="soa-choice-card-desc">
                    I'll walk you through each configuration step by step—no doc needed.
                  </p>
                </button>
                <button className="soa-choice-card" onClick={() => handleChoiceCard('template')}>
                  <p className="soa-choice-card-title">Quick setup from industry template</p>
                  <p className="soa-choice-card-desc">
                    Choose your industry and I'll apply a standard configuration template.
                  </p>
                </button>
                <button className="soa-skip-btn" onClick={handleSkip}>
                  Skip and ask me questions
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`soa-message ${msg.role}`}>
                  {msg.role === 'agent' && msg.type !== 'quick-suggestions' && (
                    <div className="soa-message-sender">Service Operations Agent</div>
                  )}
                  {msg.type === 'quick-suggestions' || msg.type === 'adaptive-card' ? (
                    renderMessageContent(msg)
                  ) : msg.type === 'rtq-success' ? (
                    renderMessageContent(msg)
                  ) : (
                    <div className="soa-message-bubble">{renderMessageContent(msg)}</div>
                  )}
                  {msg.role === 'agent' &&
                    msg.type !== 'quick-suggestions' &&
                    msg.type !== 'adaptive-card' &&
                    msg.type !== 'rtq-success' && (
                      <div className="soa-message-actions">
                        <button className="soa-message-action-btn" title="Thumbs up"><ThumbUpIcon /></button>
                        <button className="soa-message-action-btn" title="Thumbs down"><ThumbDownIcon /></button>
                        <button className="soa-message-action-btn" title="Copy"><CopyIcon /></button>
                      </div>
                    )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="soa-input-area">
          <div className="soa-input-row">
            <button className="soa-add-btn" title="Attach">+</button>
            <textarea
              ref={inputRef}
              className="soa-input-field"
              placeholder="Message Copilot"
              rows={1}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <button
              className={`soa-send-btn${inputValue.trim() ? ' active' : ''}`}
              onClick={() => handleUserMessage(inputValue)}
              title="Send"
            >
              <SendIconSVG />
            </button>
          </div>
          <div className="soa-ai-note">AI generated content may be incorrect.</div>
        </div>
      </div>

      {/* ── Center + Right: Canvas ── */}
      <div className="soa-canvas-area">
        <div className="soa-canvas-header">Canvas</div>
        <div className="soa-canvas-body">
          {/* Setup Visual panel */}
          <div className="soa-setup-visual">
            <div className="soa-setup-visual-tabs">
              <button
                className={`soa-setup-tab${activeTab === 'setup' ? ' active' : ''}`}
                onClick={() => setActiveTab('setup')}
              >
                Setup Visual
              </button>
              <button
                className={`soa-setup-tab${activeTab === 'blueprint' ? ' active' : ''}`}
                onClick={() => setActiveTab('blueprint')}
              >
                Blueprint
              </button>
              <button
                className={`soa-setup-tab${activeTab === 'simulation' ? ' active' : ''}`}
                onClick={() => setActiveTab('simulation')}
              >
                Simulation
              </button>
            </div>

            {activeTab === 'setup' && (
              <div className="soa-config-cards">
                {configCards.map(renderConfigCard)}
              </div>
            )}
            {activeTab === 'blueprint' && (
              <div style={{ padding: 24, color: '#797775', fontSize: 13, textAlign: 'center' }}>
                Blueprint view coming soon
              </div>
            )}
            {activeTab === 'simulation' && (
              <div style={{ padding: 24, color: '#797775', fontSize: 13, textAlign: 'center' }}>
                Simulation view coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Detail Panel ── */}
      {renderDetailPanel()}
    </div>
  );
};

export default ServiceOperationsAgent;
