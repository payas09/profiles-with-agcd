/**
 * Overflow Handling Editor - Specialized template editor for overflow scenarios
 *
 * IMPORTANT: For creating new template editors or modifying this one,
 * refer to the Template Editor Guide: src/components/TEMPLATE_EDITOR_GUIDE.md
 *
 * This editor follows the standard template structure documented in the guide.
 */

import React, { useState } from 'react';
import './TemplateBasedEditor.css';

// Queue data for transfer action
const queues = [
  { id: 'q1', name: 'General Support Queue' },
  { id: 'q2', name: 'VIP Support Queue' },
  { id: 'q3', name: 'Technical Support Queue' },
  { id: 'q4', name: 'Sales Queue' },
  { id: 'q5', name: 'Billing Queue' },
  { id: 'q6', name: 'Escalation Queue' },
  { id: 'q7', name: 'After Hours Queue' },
  { id: 'q8', name: 'Overflow Queue' },
];

// Context variables for additional filtering
const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', values: ['True', 'False'] },
  { id: 'CustomerTier', label: 'Customer Tier', values: ['Gold', 'Silver', 'Bronze', 'Standard', 'Platinum', 'Diamond', 'Enterprise', 'SMB', 'Startup'] },
  { id: 'Language', label: 'Preferred Language', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese'] },
  { id: 'Region', label: 'Customer Region', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'] },
  { id: 'AccountType', label: 'Account Type', values: ['Premium', 'Standard', 'Trial', 'Free', 'Enterprise', 'Government', 'Education'] },
];

const liveWorkItemVariables = [
  { id: 'Intent', label: 'Conversation Intent', values: ['Fraud Assist', 'Billing Inquiry', 'Technical Support', 'General Inquiry', 'Account Management', 'Sales', 'Complaints', 'Returns'] },
  { id: 'Channel', label: 'Channel', values: ['Voice', 'Chat', 'Email', 'Social', 'SMS', 'WhatsApp', 'Teams', 'Web'] },
  { id: 'Priority', label: 'Priority', values: ['Urgent', 'High', 'Medium', 'Low'] },
  { id: 'Sentiment', label: 'Customer Sentiment', values: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },
];

// Overflow condition options
interface OverflowConditionOption {
  id: string;
  label: string;
  requiresValue: boolean;
  valueType?: 'time' | 'number' | 'timeRange';
  valueLabel?: string;
  valuePlaceholder?: string;
}

const overflowConditionOptions: OverflowConditionOption[] = [
  { id: 'estimated-wait-time', label: 'the estimated average wait time >', requiresValue: true, valueType: 'time', valueLabel: 'minutes', valuePlaceholder: '5' },
  { id: 'conversations-waiting', label: 'the conversations waiting in the queue >', requiresValue: true, valueType: 'number', valueLabel: 'conversations', valuePlaceholder: '10' },
  { id: 'actual-wait-time', label: 'the actual in queue wait time >', requiresValue: true, valueType: 'time', valueLabel: 'minutes', valuePlaceholder: '5' },
  { id: 'all-agents-offline', label: 'all agents are offline or away', requiresValue: false },
  { id: 'no-agents-available', label: 'no agents are available immediately', requiresValue: false },
  { id: 'out-of-hours', label: 'the queue is out of operating hours', requiresValue: false },
  { id: 'closing-soon', label: 'the queue will be out of operation in next', requiresValue: true, valueType: 'time', valueLabel: 'minutes', valuePlaceholder: '30' },
];

// Overflow action options
interface OverflowActionOption {
  id: string;
  label: string;
  requiresValue: boolean;
  valueType?: 'queue' | 'phone' | 'text';
  valueLabel?: string;
  valuePlaceholder?: string;
}

const overflowActionOptions: OverflowActionOption[] = [
  { id: 'transfer-queue', label: 'Transfer to another queue', requiresValue: true, valueType: 'queue', valueLabel: 'Queue', valuePlaceholder: 'Select queue' },
  { id: 'transfer-external', label: 'Transfer to external number', requiresValue: true, valueType: 'phone', valueLabel: 'Number', valuePlaceholder: '+1-800-XXX-XXXX' },
  { id: 'offer-callback', label: 'Offer direct callback', requiresValue: false },
  { id: 'send-voicemail', label: 'Send to voicemail', requiresValue: false },
  { id: 'scheduled-callback', label: 'Offer scheduled callback', requiresValue: false },
  { id: 'end-conversation', label: 'End the conversation', requiresValue: false },
];

// Time options for dropdowns
const timeOptions = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120];
const conversationCountOptions = [5, 10, 15, 20, 25, 30, 50, 75, 100];

// Example Playbook for Overflow
const examplePlaybook = `For VIP customers where the estimated average wait time > 5 minutes or all agents are offline or away, transfer to VIP Support Queue.

For all other customers where the actual in queue wait time > 10 minutes, offer direct callback.

For customers where the queue is out of operating hours, transfer to After Hours Queue.`;

interface SelectedVariable {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface SelectedOverflowCondition {
  id: string;
  conditionId: string;
  value?: string | number;
}

interface OverflowBranch {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  overflowConditions: SelectedOverflowCondition[];
  actionId: string;
  actionValue?: string;
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

interface OverflowHandlingEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
}

// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  excludeMode?: boolean;
  onExcludeModeChange?: (exclude: boolean) => void;
  hasError?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'choose',
  excludeMode = false,
  onExcludeModeChange,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAllSelected = selected.length === options.length && options.every(opt => selected.includes(opt));

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (isAllSelected && !excludeMode) return 'All';
    if (excludeMode) {
      if (selected.length === 0) return placeholder;
      return `All except ${selected.join(', ')}`;
    }
    return selected.join(' or ');
  };

  return (
    <div className="multi-select-dropdown">
      <button
        type="button"
        className={`multi-select-trigger ${excludeMode ? 'exclude-mode' : ''} ${isAllSelected && !excludeMode ? 'all-selected' : ''} ${hasError ? 'has-error' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected.length > 0 ? 'has-selection' : 'placeholder'}>
          {getDisplayText()}
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5"/>
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="multi-select-backdrop" onClick={() => setIsOpen(false)} />
          <div className="multi-select-menu">
            {onExcludeModeChange && (
              <div className="multi-select-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${!excludeMode ? 'active' : ''}`}
                  onClick={() => onExcludeModeChange(false)}
                >
                  Include
                </button>
                <button
                  type="button"
                  className={`mode-btn ${excludeMode ? 'active' : ''}`}
                  onClick={() => onExcludeModeChange(true)}
                >
                  Exclude
                </button>
              </div>
            )}
            <div className="multi-select-hint">
              {excludeMode ? 'Select values to exclude:' : 'Select values to include:'}
            </div>
            {!excludeMode && (
              <label className="multi-select-option all-option">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                />
                <span>All</span>
              </label>
            )}
            {options.map(option => (
              <label key={option} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const OverflowHandlingEditor: React.FC<OverflowHandlingEditorProps> = ({
  initialRequirement,
  onPromptGenerated
}) => {
  // Selected variables
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>([]);
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>([]);

  // Number of branches (default 2, range 1-5)
  const [numberOfBranches, setNumberOfBranches] = useState<number>(2);

  // Branch configuration
  const [branches, setBranches] = useState<OverflowBranch[]>([]);

  // Template generated flag
  const [isTemplateGenerated, setIsTemplateGenerated] = useState(false);

  // Section collapse states
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(true);
  const [isBranchesSectionOpen, setIsBranchesSectionOpen] = useState(true);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; fieldId: string; message: string }[]>([]);

  // Get all selected variables
  const allSelectedVariables: SelectedVariable[] = [...selectedContextVars, ...selectedLWIVars];

  // Add context variable
  const addContextVariable = (varId: string) => {
    if (!varId || selectedContextVars.find(v => v.id === varId)) return;
    const variable = contextVariables.find(v => v.id === varId);
    if (variable) {
      setSelectedContextVars(prev => [...prev, {
        ...variable,
        description: '',
        type: 'context'
      }]);
    }
  };

  const removeContextVariable = (varId: string) => {
    setSelectedContextVars(prev => prev.filter(v => v.id !== varId));
  };

  const updateContextVarDescription = (varId: string, description: string) => {
    setSelectedContextVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
  };

  const addLWIVariable = (varId: string) => {
    if (!varId || selectedLWIVars.find(v => v.id === varId)) return;
    const variable = liveWorkItemVariables.find(v => v.id === varId);
    if (variable) {
      setSelectedLWIVars(prev => [...prev, {
        ...variable,
        description: '',
        type: 'lwi'
      }]);
    }
  };

  const removeLWIVariable = (varId: string) => {
    setSelectedLWIVars(prev => prev.filter(v => v.id !== varId));
  };

  const updateLWIVarDescription = (varId: string, description: string) => {
    setSelectedLWIVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
  };

  const availableContextVars = contextVariables.filter(
    v => !selectedContextVars.find(sv => sv.id === v.id)
  );
  const availableLWIVars = liveWorkItemVariables.filter(
    v => !selectedLWIVars.find(sv => sv.id === v.id)
  );

  const canGenerateTemplate = numberOfBranches >= 1;

  const handleGenerateTemplate = () => {
    const generatedBranches: OverflowBranch[] = [];
    for (let i = 0; i < numberOfBranches; i++) {
      generatedBranches.push({
        id: `branch-${i}`,
        variableValues: {},
        variableExcludeMode: {},
        disabledVariables: [],
        overflowConditions: [
          { id: `condition-${i}-0`, conditionId: 'estimated-wait-time', value: 5 }
        ],
        actionId: 'transfer-queue',
        actionValue: ''
      });
    }
    setBranches(generatedBranches);
    setIsTemplateGenerated(true);
    setIsVariablesSectionOpen(false);
    setIsBranchesSectionOpen(false);
  };

  const handleBranchValueChange = (branchId: string, variableId: string, values: string[]) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          variableValues: { ...branch.variableValues, [variableId]: values }
        };
      }
      return branch;
    }));
  };

  const handleVariableExcludeModeChange = (branchId: string, variableId: string, exclude: boolean) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          variableExcludeMode: { ...(branch.variableExcludeMode || {}), [variableId]: exclude }
        };
      }
      return branch;
    }));
  };

  const toggleVariableForBranch = (branchId: string, variableId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        const isDisabled = branch.disabledVariables?.includes(variableId);
        return {
          ...branch,
          disabledVariables: isDisabled
            ? branch.disabledVariables.filter(id => id !== variableId)
            : [...(branch.disabledVariables || []), variableId]
        };
      }
      return branch;
    }));
  };

  // Overflow condition handlers
  const handleAddOverflowCondition = (branchId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId && branch.overflowConditions.length < 5) {
        const newCondition: SelectedOverflowCondition = {
          id: `condition-${branchId}-${Date.now()}`,
          conditionId: 'estimated-wait-time',
          value: 5
        };
        return {
          ...branch,
          overflowConditions: [...branch.overflowConditions, newCondition]
        };
      }
      return branch;
    }));
  };

  const handleRemoveOverflowCondition = (branchId: string, conditionId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId && branch.overflowConditions.length > 1) {
        return {
          ...branch,
          overflowConditions: branch.overflowConditions.filter(c => c.id !== conditionId)
        };
      }
      return branch;
    }));
  };

  const handleOverflowConditionChange = (branchId: string, conditionId: string, newConditionId: string) => {
    const conditionOption = overflowConditionOptions.find(c => c.id === newConditionId);
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          overflowConditions: branch.overflowConditions.map(c => {
            if (c.id === conditionId) {
              return {
                ...c,
                conditionId: newConditionId,
                value: conditionOption?.requiresValue ? (conditionOption.valueType === 'number' ? 10 : 5) : undefined
              };
            }
            return c;
          })
        };
      }
      return branch;
    }));
  };

  const handleOverflowConditionValueChange = (branchId: string, conditionId: string, value: string | number) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          overflowConditions: branch.overflowConditions.map(c => {
            if (c.id === conditionId) {
              return { ...c, value };
            }
            return c;
          })
        };
      }
      return branch;
    }));
  };

  // Action handlers
  const handleActionChange = (branchId: string, actionId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          actionId,
          actionValue: ''
        };
      }
      return branch;
    }));
  };

  const handleActionValueChange = (branchId: string, value: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return { ...branch, actionValue: value };
      }
      return branch;
    }));
  };

  const addBranch = () => {
    const newBranch: OverflowBranch = {
      id: `branch-${Date.now()}`,
      variableValues: {},
      variableExcludeMode: {},
      disabledVariables: [],
      overflowConditions: [
        { id: `condition-new-0`, conditionId: 'estimated-wait-time', value: 5 }
      ],
      actionId: 'transfer-queue',
      actionValue: ''
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
  };

  const getQueueName = (id: string) => {
    const queue = queues.find(q => q.id === id);
    return queue?.name || '';
  };

  const formatConditionText = (condition: SelectedOverflowCondition): string => {
    const option = overflowConditionOptions.find(o => o.id === condition.conditionId);
    if (!option) return '';

    if (option.requiresValue) {
      const value = condition.value || '[choose value]';
      if (option.valueType === 'time') {
        return `${option.label} ${value} ${option.valueLabel}`;
      } else if (option.valueType === 'number') {
        return `${option.label} ${value}`;
      }
      return `${option.label} ${value}`;
    }
    return option.label;
  };

  const formatActionText = (actionId: string, actionValue?: string): string => {
    const action = overflowActionOptions.find(a => a.id === actionId);
    if (!action) return '';

    if (action.requiresValue) {
      if (action.valueType === 'queue') {
        const queueName = actionValue ? getQueueName(actionValue) : '';
        return `${action.label}: ${queueName || '[select queue]'}`;
      } else if (action.valueType === 'phone') {
        return `${action.label}: ${actionValue || '[enter number]'}`;
      }
    }
    return action.label;
  };

  const generateFinalPrompt = (): string => {
    const lines: string[] = [];

    if (allSelectedVariables.length > 0) {
      const varParts = allSelectedVariables.map(v => {
        const desc = v.description || v.label.toLowerCase();
        if (v.type === 'context') {
          return `the ${desc} from ContextVariable.${v.id}`;
        } else {
          return `the ${desc} from LiveWorkItem.${v.id}`;
        }
      });
      lines.push(`Get ${varParts.join(' and ')}.`);
    }

    branches.forEach((branch) => {
      const activeVariables = allSelectedVariables.filter(
        v => !(branch.disabledVariables || []).includes(v.id)
      );

      const customerConditionParts = activeVariables.map(v => {
        const values = branch.variableValues[v.id] || [];
        const isExclude = branch.variableExcludeMode?.[v.id] || false;
        const isAllSelected = values.length === v.values.length;
        if (values.length === 0) {
          return `${v.description || v.label} is [choose value]`;
        }
        if (isExclude) {
          return `${v.description || v.label} is All except ${values.join(', ')}`;
        }
        if (isAllSelected) {
          return `${v.description || v.label} is All`;
        }
        return `${v.description || v.label} is ${values.join(' or ')}`;
      });

      const overflowConditionParts = branch.overflowConditions.map(c => formatConditionText(c));

      const actionText = formatActionText(branch.actionId, branch.actionValue);

      let conditionText = '';
      if (customerConditionParts.length > 0) {
        conditionText = `For customers where ${customerConditionParts.join(' AND ')} and (${overflowConditionParts.join(' or ')})`;
      } else {
        conditionText = `For all customers where ${overflowConditionParts.join(' or ')}`;
      }

      lines.push(`${conditionText}, ${actionText.toLowerCase()}.`);
    });

    lines.push('For all other cases, continue with normal queue processing.');

    return lines.join('\n\n');
  };

  const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
    const errors: { branchId: string; fieldId: string; message: string }[] = [];

    branches.forEach((branch, branchIndex) => {
      // Validate overflow conditions have values where required
      branch.overflowConditions.forEach((condition, condIdx) => {
        const option = overflowConditionOptions.find(o => o.id === condition.conditionId);
        if (option?.requiresValue && !condition.value) {
          errors.push({
            branchId: branch.id,
            fieldId: condition.id,
            message: `Branch ${branchIndex + 1}: Please enter a value for overflow condition ${condIdx + 1}`
          });
        }
      });

      // Validate action has value where required
      const action = overflowActionOptions.find(a => a.id === branch.actionId);
      if (action?.requiresValue && !branch.actionValue) {
        errors.push({
          branchId: branch.id,
          fieldId: 'action',
          message: `Branch ${branchIndex + 1}: Please ${action.valueType === 'queue' ? 'select a queue' : 'enter a value'} for the action`
        });
      }
    });

    return errors;
  };

  const hasError = (branchId: string, fieldId: string): boolean => {
    return validationErrors.some(e => e.branchId === branchId && e.fieldId === fieldId);
  };

  const handleApplyTemplate = () => {
    const errors = validateBranches();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const prompt = generateFinalPrompt();

    const config: PolicyConfig = {
      selectedVariables: allSelectedVariables.map(v => ({
        id: v.id,
        label: v.label,
        type: v.type
      })),
      conditions: branches.map(b => ({
        id: b.id,
        conditions: allSelectedVariables.map(v => ({
          variableId: v.id,
          variableLabel: v.label,
          variableType: v.type,
          values: b.variableValues[v.id] || []
        })),
        action: 'queue-strategy' as const,
        userAttributes: []
      })),
      defaultAction: 'queue-strategy'
    };

    if (onPromptGenerated) {
      onPromptGenerated(prompt, config);
    }
  };

  return (
    <div className="template-editor-container">
      {/* Requirement Banner */}
      {initialRequirement && (
        <div className="template-requirement-banner">
          <span className="req-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span className="req-label">Your requirement:</span>
          <span className="req-text">"{initialRequirement}"</span>
        </div>
      )}

      {/* Example Playbook Section */}
      <div className="example-playbook-section">
        <div className="example-playbook-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <span>Example Playbook - Overflow Handling</span>
        </div>
        <div className="example-playbook-content">
          <pre className="example-playbook-text">{examplePlaybook}</pre>
        </div>
      </div>

      {/* Section 1: Variable Selection */}
      <div className="template-section">
        <div
          className="section-header"
          onClick={() => setIsVariablesSectionOpen(!isVariablesSectionOpen)}
        >
          <div className="section-header-left">
            <span className={`section-chevron ${isVariablesSectionOpen ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </span>
            <span className="section-number">1</span>
            <h3 className="section-title">Select Variables (Optional)</h3>
            {!isVariablesSectionOpen && allSelectedVariables.length > 0 && (
              <span className="section-summary">
                {allSelectedVariables.length} variable{allSelectedVariables.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          {allSelectedVariables.length > 0 && (
            <span className="section-check">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#107c10">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            </span>
          )}
        </div>

        {isVariablesSectionOpen && (
          <div className="section-content">
            <p className="section-desc">
              Optionally select variables to create conditional overflow rules. Skip this if you want the same overflow logic for all customers.
            </p>

            <div className="variables-grid">
              {/* Context Variables */}
              <div className="variable-category">
                <h4 className="category-title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  Customer Attributes (Context Variables)
                </h4>

                {selectedContextVars.length > 0 && (
                  <div className="selected-variables-list">
                    {selectedContextVars.map(v => (
                      <div key={v.id} className="selected-variable-item">
                        <div className="selected-var-header">
                          <span className="selected-var-label">{v.label}</span>
                          <button
                            className="remove-var-btn"
                            onClick={() => removeContextVariable(v.id)}
                            title="Remove variable"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                          </button>
                        </div>
                        <input
                          type="text"
                          className="var-description-input"
                          placeholder={`Describe how this appears in playbook (e.g., "${v.label.toLowerCase()}")`}
                          value={v.description}
                          onChange={(e) => updateContextVarDescription(v.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {availableContextVars.length > 0 && (
                  <select
                    className="add-variable-dropdown"
                    value=""
                    onChange={(e) => addContextVariable(e.target.value)}
                  >
                    <option value="">+ Add customer attribute...</option>
                    {availableContextVars.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Live Work Item Variables */}
              <div className="variable-category">
                <h4 className="category-title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Conversation Attributes (Live Work Item)
                </h4>

                {selectedLWIVars.length > 0 && (
                  <div className="selected-variables-list">
                    {selectedLWIVars.map(v => (
                      <div key={v.id} className="selected-variable-item">
                        <div className="selected-var-header">
                          <span className="selected-var-label">{v.label}</span>
                          <button
                            className="remove-var-btn"
                            onClick={() => removeLWIVariable(v.id)}
                            title="Remove variable"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                          </button>
                        </div>
                        <input
                          type="text"
                          className="var-description-input"
                          placeholder={`Describe how this appears in playbook (e.g., "${v.label.toLowerCase()}")`}
                          value={v.description}
                          onChange={(e) => updateLWIVarDescription(v.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {availableLWIVars.length > 0 && (
                  <select
                    className="add-variable-dropdown"
                    value=""
                    onChange={(e) => addLWIVariable(e.target.value)}
                  >
                    <option value="">+ Add conversation attribute...</option>
                    {availableLWIVars.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Number of Branches */}
      <div className="template-section">
        <div
          className="section-header"
          onClick={() => setIsBranchesSectionOpen(!isBranchesSectionOpen)}
        >
          <div className="section-header-left">
            <span className={`section-chevron ${isBranchesSectionOpen ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </span>
            <span className="section-number">2</span>
            <h3 className="section-title">Configure Overflow Rules</h3>
            {!isBranchesSectionOpen && numberOfBranches > 0 && (
              <span className="section-summary">
                {numberOfBranches} rule{numberOfBranches > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {numberOfBranches > 0 && (
            <span className="section-check">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#107c10">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            </span>
          )}
        </div>

        {isBranchesSectionOpen && (
          <div className="section-content">
            <p className="section-desc">
              Enter the number of overflow rules. Each rule defines conditions that trigger overflow actions.
            </p>

            <div className="branch-number-input-group">
              <label className="branch-number-label">Number of overflow rules:</label>
              <input
                type="number"
                className="branch-number-input"
                value={numberOfBranches}
                onChange={(e) => setNumberOfBranches(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={5}
              />
            </div>

            <div className="branch-example-box">
              <h5 className="example-title">What are overflow rules?</h5>
              <p className="example-desc">
                Each rule defines when to trigger overflow and what action to take:
              </p>
              <ul className="example-list">
                <li><strong>Condition:</strong> Wait time &gt; 5 minutes OR all agents offline</li>
                <li><strong>Action:</strong> Transfer to Overflow Queue</li>
              </ul>
              <p className="example-note">You can add multiple conditions per rule and select different actions.</p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Template Button */}
      {!isTemplateGenerated && (
        <div className="generate-template-section">
          <button
            className="generate-template-btn"
            onClick={handleGenerateTemplate}
            disabled={!canGenerateTemplate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Generate Template
          </button>
        </div>
      )}

      {/* Section 3: Generated Template */}
      {isTemplateGenerated && (
        <div className="template-section template-output-section">
          <div className="section-header non-collapsible">
            <div className="section-header-left">
              <span className="section-number">3</span>
              <h3 className="section-title">Generated Playbook Template</h3>
            </div>
            <button
              className="regenerate-btn"
              onClick={() => {
                setIsTemplateGenerated(false);
                setIsVariablesSectionOpen(true);
                setIsBranchesSectionOpen(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
              </svg>
              Modify
            </button>
          </div>

          <div className="section-content template-output-content">
            <p className="template-instruction">
              Fill in the <span className="highlight-text">blue dropdowns</span> to customize your overflow playbook.
            </p>

            <div className="template-output">
              {/* Variable Declaration */}
              {allSelectedVariables.length > 0 && (
                <div className="template-line">
                  Get{' '}
                  {allSelectedVariables.map((v, idx) => (
                    <React.Fragment key={v.id}>
                      {idx > 0 && ' and '}
                      the {v.description || v.label.toLowerCase()} from{' '}
                      <span className="template-variable">
                        {v.type === 'context' ? 'ContextVariable' : 'LiveWorkItem'}.{v.id}
                      </span>
                    </React.Fragment>
                  ))}.
                </div>
              )}

              {/* Overflow Branches */}
              {branches.map((branch) => {
                const activeVariables = allSelectedVariables.filter(
                  v => !(branch.disabledVariables || []).includes(v.id)
                );
                const disabledVariables = allSelectedVariables.filter(
                  v => (branch.disabledVariables || []).includes(v.id)
                );
                const currentAction = overflowActionOptions.find(a => a.id === branch.actionId);

                return (
                  <React.Fragment key={branch.id}>
                    {/* Main condition line */}
                    <div className="template-line condition-line">
                      {activeVariables.length > 0 ? (
                        <>
                          For customers where{' '}
                          {activeVariables.map((v, varIdx) => (
                            <React.Fragment key={v.id}>
                              {varIdx > 0 && ' AND '}
                              <span className="variable-condition">
                                <button
                                  className="variable-toggle-btn"
                                  onClick={() => toggleVariableForBranch(branch.id, v.id)}
                                  title="Click to disable this variable for this rule"
                                >×</button>
                                {v.description || v.label}{' '}
                                {branch.variableExcludeMode?.[v.id] ? 'is not' : 'is'}{' '}
                                <MultiSelectDropdown
                                  options={v.values}
                                  selected={branch.variableValues[v.id] || []}
                                  onChange={(values) => handleBranchValueChange(branch.id, v.id, values)}
                                  placeholder="choose"
                                  excludeMode={branch.variableExcludeMode?.[v.id] || false}
                                  onExcludeModeChange={(exclude) => handleVariableExcludeModeChange(branch.id, v.id, exclude)}
                                />
                              </span>
                            </React.Fragment>
                          ))}
                          {disabledVariables.length > 0 && (
                            <span className="disabled-variables">
                              {disabledVariables.map(v => (
                                <button
                                  key={v.id}
                                  className="disabled-variable-chip"
                                  onClick={() => toggleVariableForBranch(branch.id, v.id)}
                                  title="Click to enable this variable"
                                >
                                  + {v.description || v.label}
                                </button>
                              ))}
                            </span>
                          )}
                          {' '}and{' '}
                        </>
                      ) : (
                        <>For all customers where{' '}</>
                      )}
                      <button
                        className="inline-add-btn"
                        onClick={addBranch}
                        title="Add rule after this"
                      >+</button>
                      {branches.length > 1 && (
                        <button
                          className="inline-remove-btn"
                          onClick={() => removeBranch(branch.id)}
                          title="Remove this rule"
                        >×</button>
                      )}
                    </div>

                    {/* Overflow Conditions */}
                    <div className="template-line overflow-conditions-line">
                      <span className="condition-bracket">(</span>
                      {branch.overflowConditions.map((condition, condIdx) => {
                        const condOption = overflowConditionOptions.find(o => o.id === condition.conditionId);
                        return (
                          <React.Fragment key={condition.id}>
                            {condIdx > 0 && <span className="condition-or"> or </span>}
                            <span className="overflow-condition-item">
                              <select
                                className="template-dropdown overflow-condition-dropdown"
                                value={condition.conditionId}
                                onChange={(e) => handleOverflowConditionChange(branch.id, condition.id, e.target.value)}
                              >
                                {overflowConditionOptions.map(opt => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                              {condOption?.requiresValue && (
                                <>
                                  {condOption.valueType === 'time' && (
                                    <select
                                      className={`template-dropdown small ${hasError(branch.id, condition.id) ? 'has-error' : ''}`}
                                      value={condition.value || 5}
                                      onChange={(e) => handleOverflowConditionValueChange(branch.id, condition.id, parseInt(e.target.value))}
                                    >
                                      {timeOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                  )}
                                  {condOption.valueType === 'number' && (
                                    <select
                                      className={`template-dropdown small ${hasError(branch.id, condition.id) ? 'has-error' : ''}`}
                                      value={condition.value || 10}
                                      onChange={(e) => handleOverflowConditionValueChange(branch.id, condition.id, parseInt(e.target.value))}
                                    >
                                      {conversationCountOptions.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  )}
                                  <span className="value-label">{condOption.valueLabel}</span>
                                </>
                              )}
                              {branch.overflowConditions.length < 5 && condIdx === branch.overflowConditions.length - 1 && (
                                <button
                                  className="inline-add-btn"
                                  onClick={() => handleAddOverflowCondition(branch.id)}
                                  title="Add condition (max 5)"
                                >+</button>
                              )}
                              {branch.overflowConditions.length > 1 && (
                                <button
                                  className="inline-remove-btn"
                                  onClick={() => handleRemoveOverflowCondition(branch.id, condition.id)}
                                  title="Remove this condition"
                                >×</button>
                              )}
                            </span>
                          </React.Fragment>
                        );
                      })}
                      <span className="condition-bracket">)</span>
                    </div>

                    {/* Action Line */}
                    <div className="template-line action-line">
                      <span className="action-arrow">→</span>
                      <select
                        className="template-dropdown action-dropdown"
                        value={branch.actionId}
                        onChange={(e) => handleActionChange(branch.id, e.target.value)}
                      >
                        {overflowActionOptions.map(action => (
                          <option key={action.id} value={action.id}>{action.label}</option>
                        ))}
                      </select>
                      {currentAction?.requiresValue && currentAction.valueType === 'queue' && (
                        <select
                          className={`template-dropdown ${hasError(branch.id, 'action') ? 'has-error' : ''}`}
                          value={branch.actionValue || ''}
                          onChange={(e) => handleActionValueChange(branch.id, e.target.value)}
                        >
                          <option value="">Select queue...</option>
                          {queues.map(q => (
                            <option key={q.id} value={q.id}>{q.name}</option>
                          ))}
                        </select>
                      )}
                      {currentAction?.requiresValue && currentAction.valueType === 'phone' && (
                        <input
                          type="text"
                          className={`template-input ${hasError(branch.id, 'action') ? 'has-error' : ''}`}
                          placeholder={currentAction.valuePlaceholder}
                          value={branch.actionValue || ''}
                          onChange={(e) => handleActionValueChange(branch.id, e.target.value)}
                        />
                      )}
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Default Fallback */}
              <div className="template-line default-fallback">
                For all other cases, continue with normal queue processing.
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                <div className="validation-error-header">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <span>Please fix the following errors:</span>
                </div>
                <ul className="validation-error-list">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Button */}
            <div className="template-actions">
              <button className="apply-template-btn" onClick={handleApplyTemplate}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Apply Playbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverflowHandlingEditor;
