import React, { useState, useRef, useEffect } from 'react';
import './CopilotPromptEditor.css';

// ============================================
// Scenario Templates
// ============================================

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[]; // Keywords to match from user input
  template: string;
  placeholders: PlaceholderConfig[];
}

interface PlaceholderConfig {
  id: string;
  label: string;
  type: 'variable-select' | 'value-select' | 'number' | 'multi-condition';
  variableType?: 'context' | 'lwi' | 'both';
  dependsOn?: string; // For value-select that depends on a variable
  options?: { id: string; label: string }[];
  defaultValue?: string;
}

// Available variables
const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', values: ['True', 'False'] },
  { id: 'CustomerTier', label: 'Customer Tier', values: ['Gold', 'Silver', 'Bronze', 'Standard', 'Platinum', 'Diamond', 'Enterprise', 'SMB', 'Startup'] },
  { id: 'Language', label: 'Preferred Language', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Italian', 'Korean', 'Arabic', 'Hindi', 'Dutch'] },
  { id: 'Region', label: 'Customer Region', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Australia', 'India', 'China', 'Japan'] },
  { id: 'AccountType', label: 'Account Type', values: ['Premium', 'Standard', 'Trial', 'Free', 'Enterprise', 'Government', 'Education', 'Non-Profit'] },
];

const liveWorkItemVariables = [
  { id: 'Intent', label: 'Conversation Intent', values: ['Fraud Assist', 'Billing Inquiry', 'Technical Support', 'General Inquiry', 'Account Management', 'Sales', 'Complaints', 'Returns', 'Shipping', 'Product Info', 'Subscription', 'Cancellation'] },
  { id: 'Channel', label: 'Channel', values: ['Voice', 'Chat', 'Email', 'Social', 'SMS', 'WhatsApp', 'Teams', 'Web'] },
  { id: 'Priority', label: 'Priority', values: ['Urgent', 'High', 'Medium', 'Low'] },
  { id: 'Sentiment', label: 'Customer Sentiment', values: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },
  { id: 'ProductCategory', label: 'Product Category', values: ['Software', 'Hardware', 'Services', 'Subscription', 'Support', 'Training', 'Consulting'] },
];

const allVariables = [
  ...contextVariables.map(v => ({ ...v, type: 'context' as const })),
  ...liveWorkItemVariables.map(v => ({ ...v, type: 'lwi' as const }))
];

// Scenario Templates
const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'preferred-expert-assignment',
    name: 'Assign to Preferred Expert',
    description: 'Route customers to their designated preferred expert based on conditions',
    keywords: ['preferred', 'expert', 'designated', 'mapped', 'assigned agent', 'specific agent', 'gold', 'vip', 'priority'],
    template: `Get {variables}.

When {conditions}, assign to the customer's preferred expert.

If no preferred expert is available, assign to a previous expert who helped the customer in the last {lookback_days} days.

For all other cases, use the queue's assignment strategy.`,
    placeholders: [
      { id: 'variables', label: 'Variables to check', type: 'variable-select', variableType: 'both' },
      { id: 'conditions', label: 'Conditions', type: 'multi-condition' },
      { id: 'lookback_days', label: 'Lookback period', type: 'number', defaultValue: '14' }
    ]
  },
  {
    id: 'previous-expert-assignment',
    name: 'Assign to Previous Expert',
    description: 'Route customers to an expert they have interacted with before',
    keywords: ['previous', 'last', 'interacted', 'history', 'familiar', 'continuity', 'same agent'],
    template: `Get {variables}.

When {conditions}, assign to a previous expert who helped the customer in the last {lookback_days} days{expert_requirements}.

For all other cases, use the queue's assignment strategy.`,
    placeholders: [
      { id: 'variables', label: 'Variables to check', type: 'variable-select', variableType: 'both' },
      { id: 'conditions', label: 'Conditions', type: 'multi-condition' },
      { id: 'lookback_days', label: 'Lookback period', type: 'number', defaultValue: '14' },
      { id: 'expert_requirements', label: 'Expert requirements', type: 'variable-select', variableType: 'context' }
    ]
  },
  {
    id: 'tiered-assignment',
    name: 'Tiered Assignment Policy',
    description: 'Different assignment actions for different customer segments',
    keywords: ['tier', 'segment', 'different', 'gold silver', 'premium standard', 'vip regular', 'based on'],
    template: `Get {variables}.

{tier_conditions}

For all other cases, use the queue's assignment strategy.`,
    placeholders: [
      { id: 'variables', label: 'Variables to check', type: 'variable-select', variableType: 'both' },
      { id: 'tier_conditions', label: 'Tier-based conditions', type: 'multi-condition' }
    ]
  }
];

// ============================================
// Interfaces
// ============================================

interface Message {
  id: string;
  role: 'user' | 'copilot';
  content: string;
  timestamp: Date;
  showScenarioSelector?: boolean;
  showTemplateEditor?: boolean;
  selectedScenario?: ScenarioTemplate;
}

interface ConditionRow {
  id: string;
  variable: string;
  variableLabel: string;
  variableType: 'context' | 'lwi';
  values: string[];
  action: 'preferred-expert' | 'previous-expert' | 'queue-strategy';
  lookbackDays?: number;
}

interface PolicyConfig {
  selectedVariables: { id: string; label: string; type: 'context' | 'lwi' }[];
  conditions: {
    id: string;
    conditions: { variableId: string; variableLabel: string; variableType: 'context' | 'lwi'; values: string[] }[];
    action: 'preferred-expert' | 'previous-expert' | 'queue-strategy';
    lookbackPeriod?: number;
    userAttributes?: { id: string; value: string }[];
  }[];
  defaultAction: 'queue-strategy';
}

interface CopilotPromptEditorProps {
  scenario?: string;
  onPromptGenerated?: (prompt: string) => void;
  onPolicyConfigChange?: (config: PolicyConfig) => void;
}

// ============================================
// Main Component
// ============================================

const CopilotPromptEditor: React.FC<CopilotPromptEditorProps> = ({
  scenario: _scenario = 'Assignment Policy',
  onPromptGenerated,
  onPolicyConfigChange
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'copilot',
      content: `Hi! I'll help you create an assignment policy.\n\nTell me what you'd like to set up. For example:\n• "Gold tier customers should go to their preferred expert"\n• "Route billing inquiries to previous experts"\n• "Different handling for VIP vs regular customers"`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null);
  const [conditionRows, setConditionRows] = useState<ConditionRow[]>([]);
  const [lookbackDays, _setLookbackDays] = useState(14);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect scenario from user message
  const detectScenario = (message: string): ScenarioTemplate | null => {
    const lowerMessage = message.toLowerCase();

    // Score each scenario based on keyword matches
    let bestMatch: ScenarioTemplate | null = null;
    let bestScore = 0;

    for (const template of scenarioTemplates) {
      let score = 0;
      for (const keyword of template.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += keyword.split(' ').length; // Multi-word keywords score higher
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    return bestScore > 0 ? bestMatch : scenarioTemplates[0]; // Default to first if no match
  };

  // Add a condition row
  const addConditionRow = () => {
    const newRow: ConditionRow = {
      id: Date.now().toString(),
      variable: '',
      variableLabel: '',
      variableType: 'context',
      values: [],
      action: 'preferred-expert'
    };
    setConditionRows(prev => [...prev, newRow]);
  };

  // Update a condition row
  const updateConditionRow = (id: string, updates: Partial<ConditionRow>) => {
    setConditionRows(prev => prev.map(row =>
      row.id === id ? { ...row, ...updates } : row
    ));
  };

  // Remove a condition row
  const removeConditionRow = (id: string) => {
    setConditionRows(prev => prev.filter(row => row.id !== id));
  };

  // Generate the final prompt
  const generatePrompt = (): string => {
    if (!selectedScenario || conditionRows.length === 0) return '';

    // Get unique variables
    const uniqueVars = new Map<string, ConditionRow>();
    conditionRows.forEach(row => {
      if (row.variable && !uniqueVars.has(row.variable)) {
        uniqueVars.set(row.variable, row);
      }
    });

    const variablesList = Array.from(uniqueVars.values()).map(row => {
      if (row.variableType === 'context') {
        return `the customer's ${row.variableLabel} from ContextVariable.${row.variable}`;
      } else {
        return `the ${row.variableLabel} from LiveWorkItem.${row.variable}`;
      }
    }).join(' and ');

    const lines: string[] = [];
    lines.push(`Get ${variablesList}.`);
    lines.push('');

    // Group by action for cleaner output
    conditionRows.forEach((row, idx) => {
      if (!row.variable || row.values.length === 0) return;

      const valueText = row.values.join(' or ');
      const conditionText = `${row.variableLabel} is ${valueText}`;

      let actionText = '';
      if (row.action === 'preferred-expert') {
        actionText = "assign to the customer's preferred expert";
      } else if (row.action === 'previous-expert') {
        actionText = `assign to a previous expert who helped them in the last ${row.lookbackDays || lookbackDays} days`;
      } else {
        actionText = "use the queue's assignment strategy";
      }

      lines.push(`${idx === 0 ? 'When' : 'When'} ${conditionText}, ${actionText}.`);
      lines.push('');
    });

    lines.push("For all other cases, use the queue's assignment strategy.");

    return lines.join('\n');
  };

  // Handle generating the policy
  const handleGeneratePolicy = () => {
    const prompt = generatePrompt();
    if (!prompt) return;

    if (onPromptGenerated) {
      onPromptGenerated(prompt);
    }

    // Build policy config
    const config: PolicyConfig = {
      selectedVariables: conditionRows
        .filter(r => r.variable)
        .map(r => ({ id: r.variable, label: r.variableLabel, type: r.variableType }))
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i),
      conditions: conditionRows
        .filter(r => r.variable && r.values.length > 0)
        .map(r => ({
          id: r.id,
          conditions: [{
            variableId: r.variable,
            variableLabel: r.variableLabel,
            variableType: r.variableType,
            values: r.values
          }],
          action: r.action,
          lookbackPeriod: r.action === 'previous-expert' ? (r.lookbackDays || lookbackDays) : undefined
        })),
      defaultAction: 'queue-strategy'
    };

    if (onPolicyConfigChange) {
      onPolicyConfigChange(config);
    }

    // Add completion message
    const completeMsg: Message = {
      id: Date.now().toString(),
      role: 'copilot',
      content: "Your policy has been generated! You can see it on the right panel.\n\n• Click any value to edit it directly\n• Add more conditions below\n• Click **Save** or **Publish** when ready",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, completeMsg]);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Detect scenario and respond
    setIsTyping(true);
    setTimeout(() => {
      const detected = detectScenario(userMessage);
      setSelectedScenario(detected);

      // Initialize with one empty condition row
      if (conditionRows.length === 0) {
        addConditionRow();
      }

      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'copilot',
        content: `I'll help you set up a **${detected?.name}** policy.\n\nUse the template below to define your conditions. For each row:\n1. Select a **variable** (customer tier, intent, etc.)\n2. Choose the **values** that should trigger this condition\n3. Pick the **action** to take`,
        timestamp: new Date(),
        showTemplateEditor: true,
        selectedScenario: detected || undefined
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get values for a selected variable
  const getValuesForVariable = (variableId: string): string[] => {
    const variable = allVariables.find(v => v.id === variableId);
    return variable?.values || [];
  };

  return (
    <div className="copilot-chat-panel-full">
      <div className="copilot-chat-header">
        <div className="copilot-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
        </div>
        <div className="copilot-header-text">
          <h3>Copilot</h3>
          <span>Assignment Policy Assistant</span>
        </div>
      </div>

      <div className="copilot-messages">
        {messages.map(message => (
          <div key={message.id} className={`copilot-message ${message.role}`}>
            {message.role === 'copilot' && (
              <div className="copilot-message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                </svg>
              </div>
            )}
            <div className="copilot-message-content">
              <div className="copilot-message-text" dangerouslySetInnerHTML={{
                __html: message.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />

              {/* Template Editor */}
              {message.showTemplateEditor && (
                <div className="template-editor">
                  <div className="template-editor-header">
                    <span className="template-name">{selectedScenario?.name}</span>
                  </div>

                  {/* Condition Rows */}
                  <div className="condition-rows">
                    {conditionRows.map((row, index) => (
                      <div key={row.id} className="condition-row">
                        <div className="condition-row-header">
                          <span className="condition-label">
                            {index === 0 ? 'When' : 'Or when'}
                          </span>
                          {conditionRows.length > 1 && (
                            <button
                              className="remove-row-btn"
                              onClick={() => removeConditionRow(row.id)}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="condition-row-fields">
                          {/* Variable Select */}
                          <div className="field-group">
                            <label>Variable</label>
                            <select
                              value={row.variable}
                              onChange={(e) => {
                                const varDef = allVariables.find(v => v.id === e.target.value);
                                updateConditionRow(row.id, {
                                  variable: e.target.value,
                                  variableLabel: varDef?.label || '',
                                  variableType: varDef?.type || 'context',
                                  values: [] // Reset values when variable changes
                                });
                              }}
                            >
                              <option value="">Select variable...</option>
                              <optgroup label="Customer Attributes">
                                {contextVariables.map(v => (
                                  <option key={v.id} value={v.id}>{v.label}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Conversation Attributes">
                                {liveWorkItemVariables.map(v => (
                                  <option key={v.id} value={v.id}>{v.label}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {/* Values Multi-Select */}
                          <div className="field-group values-group">
                            <label>is</label>
                            <div className="values-selector">
                              {row.variable ? (
                                <MultiSelectDropdown
                                  options={getValuesForVariable(row.variable)}
                                  selected={row.values}
                                  onChange={(values) => updateConditionRow(row.id, { values })}
                                  placeholder="Select values..."
                                />
                              ) : (
                                <div className="placeholder-text">Select a variable first</div>
                              )}
                            </div>
                          </div>

                          {/* Action Select */}
                          <div className="field-group action-group">
                            <label>then</label>
                            <select
                              value={row.action}
                              onChange={(e) => updateConditionRow(row.id, {
                                action: e.target.value as ConditionRow['action']
                              })}
                            >
                              <option value="preferred-expert">Assign to Preferred Expert</option>
                              <option value="previous-expert">Assign to Previous Expert</option>
                              <option value="queue-strategy">Use Queue Strategy</option>
                            </select>
                          </div>

                          {/* Lookback Days (only for previous-expert) */}
                          {row.action === 'previous-expert' && (
                            <div className="field-group lookback-group">
                              <label>lookback</label>
                              <select
                                value={row.lookbackDays || lookbackDays}
                                onChange={(e) => updateConditionRow(row.id, {
                                  lookbackDays: parseInt(e.target.value)
                                })}
                              >
                                <option value="7">7 days</option>
                                <option value="14">14 days</option>
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                                <option value="90">90 days</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Row Button */}
                  <button className="add-condition-btn" onClick={addConditionRow}>
                    + Add another condition
                  </button>

                  {/* Default Fallback */}
                  <div className="default-fallback">
                    <span className="fallback-label">For all other cases:</span>
                    <span className="fallback-action">Use queue's assignment strategy</span>
                  </div>

                  {/* Generate Button */}
                  <div className="template-actions">
                    <button
                      className="generate-btn"
                      onClick={handleGeneratePolicy}
                      disabled={conditionRows.every(r => !r.variable || r.values.length === 0)}
                    >
                      Generate Policy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="copilot-message copilot">
            <div className="copilot-message-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
              </svg>
            </div>
            <div className="copilot-message-content">
              <div className="copilot-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="copilot-input-area">
        <textarea
          ref={inputRef}
          className="copilot-input"
          placeholder="Describe your routing requirements..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button
          className="copilot-send-btn"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <div className="copilot-disclaimer">
        AI-generated content may be incorrect. <a href="#">View terms</a>
      </div>
    </div>
  );
};

// ============================================
// Multi-Select Dropdown Component
// ============================================

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="multi-select-dropdown" ref={containerRef}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {selected.length > 0 ? (
          <div className="selected-chips">
            {selected.map(s => (
              <span key={s} className="selected-chip">
                {s}
                <button onClick={(e) => { e.stopPropagation(); toggleOption(s); }}>×</button>
              </span>
            ))}
          </div>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="dropdown-options">
            {filteredOptions.length === 0 ? (
              <div className="no-options">No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <label key={opt} className={`dropdown-option ${selected.includes(opt) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggleOption(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPromptEditor;
