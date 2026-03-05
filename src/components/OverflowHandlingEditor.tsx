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

// Preset configurations for common overflow scenarios
interface OverflowPreset {
  id: string;
  name: string;
  description: string;
  branches: {
    selectedConditionIds: string[];
    conditionValues: { [conditionId: string]: number };
    overflowConditionExcludeMode: boolean;
    actionId: string;
    actionValue?: string;
  }[];
  contextVariables?: { id: string; values: string[] }[];
}

const overflowPresets: OverflowPreset[] = [
  {
    id: 'basic-wait-time',
    name: 'Basic Wait Time Overflow',
    description: 'Transfer to overflow queue when wait time exceeds threshold',
    branches: [
      {
        selectedConditionIds: ['estimated-wait-time'],
        conditionValues: { 'estimated-wait-time': 5 },
        overflowConditionExcludeMode: false,
        actionId: 'transfer-queue',
        actionValue: 'q8' // Overflow Queue
      }
    ]
  },
  {
    id: 'vip-priority',
    name: 'VIP Priority Handling',
    description: 'Fast-track VIP customers, offer callback for others',
    branches: [
      {
        selectedConditionIds: ['estimated-wait-time', 'all-agents-offline'],
        conditionValues: { 'estimated-wait-time': 3 },
        overflowConditionExcludeMode: false,
        actionId: 'transfer-queue',
        actionValue: 'q2' // VIP Support Queue
      },
      {
        selectedConditionIds: ['actual-wait-time'],
        conditionValues: { 'actual-wait-time': 10 },
        overflowConditionExcludeMode: false,
        actionId: 'offer-callback'
      }
    ],
    contextVariables: [{ id: 'IsVIP', values: ['True'] }]
  },
  {
    id: 'after-hours',
    name: 'After Hours Support',
    description: 'Route to after-hours queue or voicemail when out of hours',
    branches: [
      {
        selectedConditionIds: ['out-of-hours'],
        conditionValues: {},
        overflowConditionExcludeMode: false,
        actionId: 'transfer-queue',
        actionValue: 'q7' // After Hours Queue
      },
      {
        selectedConditionIds: ['closing-soon'],
        conditionValues: { 'closing-soon': 30 },
        overflowConditionExcludeMode: false,
        actionId: 'send-voicemail'
      }
    ]
  },
  {
    id: 'callback-fallback',
    name: 'Callback Fallback',
    description: 'Offer callback when queue is busy or agents unavailable',
    branches: [
      {
        selectedConditionIds: ['conversations-waiting'],
        conditionValues: { 'conversations-waiting': 20 },
        overflowConditionExcludeMode: false,
        actionId: 'offer-callback'
      },
      {
        selectedConditionIds: ['no-agents-available'],
        conditionValues: {},
        overflowConditionExcludeMode: false,
        actionId: 'scheduled-callback'
      }
    ]
  },
  {
    id: 'escalation',
    name: 'Escalation Path',
    description: 'Transfer to escalation queue when conditions are critical',
    branches: [
      {
        selectedConditionIds: ['actual-wait-time'],
        conditionValues: { 'actual-wait-time': 15 },
        overflowConditionExcludeMode: false,
        actionId: 'transfer-queue',
        actionValue: 'q6' // Escalation Queue
      },
      {
        selectedConditionIds: ['all-agents-offline'],
        conditionValues: {},
        overflowConditionExcludeMode: false,
        actionId: 'transfer-external',
        actionValue: '+1-800-SUPPORT'
      }
    ]
  }
];

interface SelectedVariable {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface OverflowBranch {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  selectedConditionIds: string[];  // IDs of selected overflow conditions
  conditionValues: { [conditionId: string]: string | number };  // Values for conditions that require them
  overflowConditionExcludeMode: boolean;  // If true, selectedConditionIds are conditions to EXCLUDE
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

// Export types for state persistence
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

export interface TemplateEditorState {
  branches: OverflowBranchState[];
  selectedContextVars: SelectedVariableState[];
  selectedLWIVars: SelectedVariableState[];
  scenarioId?: string;
}

interface OverflowHandlingEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  initialState?: TemplateEditorState; // For restoring saved state
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
  onStateChange?: (state: TemplateEditorState, prompt: string) => void; // Called on every state change
}

// Multi-Select Dropdown Component for variable values
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

// Overflow Condition Multi-Select Dropdown with inline value display
interface OverflowConditionMultiSelectProps {
  selectedIds: string[];
  excludeMode: boolean;
  conditionValues: { [conditionId: string]: string | number };
  onSelectionChange: (selectedIds: string[]) => void;
  onExcludeModeChange: (exclude: boolean) => void;
  onValueChange: (conditionId: string, value: number) => void;
  hasError?: boolean;
}

const OverflowConditionMultiSelect: React.FC<OverflowConditionMultiSelectProps> = ({
  selectedIds,
  excludeMode,
  conditionValues,
  onSelectionChange,
  onExcludeModeChange,
  onValueChange,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCondition = (conditionId: string) => {
    if (selectedIds.includes(conditionId)) {
      onSelectionChange(selectedIds.filter(id => id !== conditionId));
    } else {
      onSelectionChange([...selectedIds, conditionId]);
    }
  };

  // Render the display content showing conditions with values
  const renderDisplayContent = () => {
    if (selectedIds.length === 0) {
      return <span className="placeholder">choose overflow condition</span>;
    }

    // For exclude mode, show conditions with their values (same as include, but with "AND" connector)
    if (excludeMode) {
      return (
        <span className="conditions-display-text">
          {selectedIds.map((condId, idx) => {
            const option = overflowConditionOptions.find(o => o.id === condId);
            if (!option) return null;
            const value = conditionValues[condId];
            return (
              <React.Fragment key={condId}>
                {idx > 0 && <span className="condition-connector-black"> and </span>}
                <span className="condition-text-part">
                  {option.label}
                  {option.requiresValue && (
                    <>
                      {' '}
                      <select
                        className="inline-value-select"
                        value={value || (option.valueType === 'number' ? 10 : 5)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onValueChange(condId, parseInt(e.target.value));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {option.valueType === 'number'
                          ? conversationCountOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))
                          : timeOptions.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))
                        }
                      </select>
                      {' '}{option.valueLabel}
                    </>
                  )}
                </span>
              </React.Fragment>
            );
          })}
        </span>
      );
    }

    // For include mode, show conditions with their values
    return (
      <span className="conditions-display-text">
        {selectedIds.map((condId, idx) => {
          const option = overflowConditionOptions.find(o => o.id === condId);
          if (!option) return null;
          const value = conditionValues[condId];
          return (
            <React.Fragment key={condId}>
              {idx > 0 && <span className="condition-connector-black"> or </span>}
              <span className="condition-text-part">
                {option.label}
                {option.requiresValue && (
                  <>
                    {' '}
                    <select
                      className="inline-value-select"
                      value={value || (option.valueType === 'number' ? 10 : 5)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onValueChange(condId, parseInt(e.target.value));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {option.valueType === 'number'
                        ? conversationCountOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        : timeOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))
                      }
                    </select>
                    {' '}{option.valueLabel}
                  </>
                )}
              </span>
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  return (
    <div className="overflow-condition-multiselect">
      <div
        className={`overflow-condition-box ${hasError ? 'has-error' : ''} ${selectedIds.length > 0 ? 'has-selection' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {renderDisplayContent()}
        <svg className="dropdown-arrow" width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5"/>
        </svg>
      </div>
      {isOpen && (
        <>
          <div className="overflow-condition-backdrop" onClick={() => setIsOpen(false)} />
          <div className="overflow-condition-menu">
            <div className="condition-mode-toggle-row">
              <button
                type="button"
                className={`condition-mode-btn ${!excludeMode ? 'active' : ''}`}
                onClick={() => onExcludeModeChange(false)}
              >
                Include
              </button>
              <button
                type="button"
                className={`condition-mode-btn ${excludeMode ? 'active' : ''}`}
                onClick={() => onExcludeModeChange(true)}
              >
                Exclude
              </button>
            </div>
            <div className="condition-list-hint">
              {excludeMode ? 'Select conditions to exclude:' : 'Select conditions to include:'}
            </div>
            <div className="condition-options-list">
              {overflowConditionOptions.map(option => (
                <label key={option.id} className="condition-checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => toggleCondition(option.id)}
                  />
                  <span className="condition-option-label">{option.label}</span>
                  {option.requiresValue && <span className="requires-value-hint">({option.valueLabel})</span>}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


const OverflowHandlingEditor: React.FC<OverflowHandlingEditorProps> = ({
  scenarioId,
  initialRequirement,
  initialState,
  onPromptGenerated,
  onStateChange
}) => {
  // Create default branch helper function
  const createDefaultBranch = (index: number): OverflowBranch => ({
    id: `branch-${index}`,
    variableValues: {},
    variableExcludeMode: {},
    disabledVariables: [],
    selectedConditionIds: [],
    conditionValues: {},
    overflowConditionExcludeMode: false,
    actionId: '',
    actionValue: ''
  });

  // Helper to restore variables from state
  const restoreVariablesFromState = (savedVars: SelectedVariableState[] | undefined, sourceVars: typeof contextVariables): SelectedVariable[] => {
    if (!savedVars || savedVars.length === 0) return [];
    return savedVars.map(sv => {
      const sourceVar = sourceVars.find(v => v.id === sv.id);
      return {
        id: sv.id,
        label: sv.label,
        description: sv.description,
        type: sv.type,
        values: sourceVar?.values || sv.values
      };
    });
  };

  // Selected variables - initialize from initialState if provided
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>(() => {
    if (initialState?.selectedContextVars) {
      return restoreVariablesFromState(initialState.selectedContextVars, contextVariables);
    }
    return [];
  });
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>(() => {
    if (initialState?.selectedLWIVars) {
      return restoreVariablesFromState(initialState.selectedLWIVars, liveWorkItemVariables);
    }
    return [];
  });

  // Branch configuration - initialize from initialState or with 2 default branches
  const [branches, setBranches] = useState<OverflowBranch[]>(() => {
    if (initialState?.branches && initialState.branches.length > 0) {
      return initialState.branches.map(b => ({
        id: b.id,
        variableValues: b.variableValues || {},
        variableExcludeMode: b.variableExcludeMode || {},
        disabledVariables: b.disabledVariables || [],
        selectedConditionIds: b.selectedConditionIds || [],
        conditionValues: b.conditionValues || {},
        overflowConditionExcludeMode: b.overflowConditionExcludeMode || false,
        actionId: b.actionId || '',
        actionValue: b.actionValue || ''
      }));
    }
    return [createDefaultBranch(0), createDefaultBranch(1)];
  });

  // Section collapse states - open Variables section if we have variables from restored state
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(() => {
    return (initialState?.selectedContextVars?.length || 0) > 0 || (initialState?.selectedLWIVars?.length || 0) > 0;
  });
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);


  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; fieldId: string; message: string }[]>([]);

  // Apply a preset configuration
  const applyPreset = (presetId: string) => {
    const preset = overflowPresets.find(p => p.id === presetId);
    if (!preset) return;

    // Create branches from preset
    const newBranches: OverflowBranch[] = preset.branches.map((branchConfig, index) => ({
      id: `branch-${Date.now()}-${index}`,
      variableValues: {},
      variableExcludeMode: {},
      disabledVariables: [],
      selectedConditionIds: branchConfig.selectedConditionIds,
      conditionValues: branchConfig.conditionValues,
      overflowConditionExcludeMode: branchConfig.overflowConditionExcludeMode,
      actionId: branchConfig.actionId,
      actionValue: branchConfig.actionValue
    }));

    setBranches(newBranches);

    // Add context variables if preset specifies them
    if (preset.contextVariables && preset.contextVariables.length > 0) {
      preset.contextVariables.forEach(cv => {
        const variable = contextVariables.find(v => v.id === cv.id);
        if (variable && !selectedContextVars.find(v => v.id === cv.id)) {
          setSelectedContextVars(prev => [...prev, {
            ...variable,
            description: '',
            type: 'context'
          }]);
        }
      });
      // Open variables section if we added variables
      setIsVariablesSectionOpen(true);
    }

    // Close tips section after applying preset
    setIsTipsSectionOpen(false);
  };

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

  // Overflow condition value change handler
  const handleConditionValueChange = (branchId: string, conditionId: string, value: string | number) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          conditionValues: { ...branch.conditionValues, [conditionId]: value }
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
    setBranches(prev => [...prev, createDefaultBranch(Date.now())]);
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

  const formatConditionText = (conditionId: string, value?: string | number): string => {
    const option = overflowConditionOptions.find(o => o.id === conditionId);
    if (!option) return '';

    if (option.requiresValue) {
      const displayValue = value || '[choose value]';
      if (option.valueType === 'time') {
        return `${option.label} ${displayValue} ${option.valueLabel}`;
      } else if (option.valueType === 'number') {
        return `${option.label} ${displayValue}`;
      }
      return `${option.label} ${displayValue}`;
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

      let overflowConditionText = '';
      if (branch.overflowConditionExcludeMode) {
        // Exclude mode: "all conditions except X"
        const excludedConditions = branch.selectedConditionIds.map(condId => {
          const option = overflowConditionOptions.find(o => o.id === condId);
          return option?.label || condId;
        });
        overflowConditionText = `all conditions except (${excludedConditions.join(' and ')})`;
      } else {
        // Include mode: "condition1 or condition2"
        const overflowConditionParts = branch.selectedConditionIds.map(condId =>
          formatConditionText(condId, branch.conditionValues[condId])
        );
        overflowConditionText = overflowConditionParts.join(' or ');
      }

      const actionText = formatActionText(branch.actionId, branch.actionValue);

      let conditionText = '';
      if (customerConditionParts.length > 0) {
        if (branch.overflowConditionExcludeMode) {
          conditionText = `For customers where ${customerConditionParts.join(' AND ')} and ${overflowConditionText}`;
        } else {
          conditionText = `For customers where ${customerConditionParts.join(' AND ')} and (${overflowConditionText})`;
        }
      } else {
        if (branch.overflowConditionExcludeMode) {
          conditionText = `For all customers, where ${overflowConditionText}`;
        } else {
          conditionText = `For all customers where ${overflowConditionText}`;
        }
      }

      lines.push(`${conditionText}, ${actionText.toLowerCase()}.`);
    });

    return lines.join('\n\n');
  };

  // Notify parent of state changes for persistence
  React.useEffect(() => {
    if (onStateChange) {
      const currentState: TemplateEditorState = {
        branches: branches.map(b => ({
          id: b.id,
          variableValues: b.variableValues,
          variableExcludeMode: b.variableExcludeMode,
          disabledVariables: b.disabledVariables,
          selectedConditionIds: b.selectedConditionIds,
          conditionValues: b.conditionValues,
          overflowConditionExcludeMode: b.overflowConditionExcludeMode,
          actionId: b.actionId,
          actionValue: b.actionValue
        })),
        selectedContextVars: selectedContextVars.map(v => ({
          id: v.id,
          label: v.label,
          description: v.description,
          type: v.type,
          values: v.values
        })),
        selectedLWIVars: selectedLWIVars.map(v => ({
          id: v.id,
          label: v.label,
          description: v.description,
          type: v.type,
          values: v.values
        })),
        scenarioId
      };
      const prompt = generateFinalPrompt();
      onStateChange(currentState, prompt);
    }
  }, [branches, selectedContextVars, selectedLWIVars, scenarioId]);

  const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
    const errors: { branchId: string; fieldId: string; message: string }[] = [];

    branches.forEach((branch, branchIndex) => {
      // Validate at least one overflow condition is selected
      if (branch.selectedConditionIds.length === 0) {
        errors.push({
          branchId: branch.id,
          fieldId: 'conditions',
          message: branch.overflowConditionExcludeMode
            ? `Rule ${branchIndex + 1}: Please select at least one condition to exclude`
            : `Rule ${branchIndex + 1}: Please select at least one overflow condition`
        });
      } else if (!branch.overflowConditionExcludeMode) {
        // Only validate values for include mode (exclude mode doesn't need values)
        branch.selectedConditionIds.forEach((condId) => {
          const option = overflowConditionOptions.find(o => o.id === condId);
          if (option?.requiresValue && !branch.conditionValues[condId]) {
            errors.push({
              branchId: branch.id,
              fieldId: condId,
              message: `Rule ${branchIndex + 1}: Please enter a value for "${option.label}"`
            });
          }
        });
      }

      // Validate action is selected
      if (!branch.actionId) {
        errors.push({
          branchId: branch.id,
          fieldId: 'action',
          message: `Rule ${branchIndex + 1}: Please select an overflow action`
        });
      } else {
        // Validate action has value where required
        const action = overflowActionOptions.find(a => a.id === branch.actionId);
        if (action?.requiresValue && !branch.actionValue) {
          errors.push({
            branchId: branch.id,
            fieldId: 'action',
            message: `Rule ${branchIndex + 1}: Please ${action.valueType === 'queue' ? 'select a queue' : 'enter a value'} for the action`
          });
        }
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

      {/* Tips for this policy - Collapsible Accordion */}
      <div className="tips-accordion">
        <div
          className="tips-accordion-header"
          onClick={() => setIsTipsSectionOpen(!isTipsSectionOpen)}
        >
          <span className={`tips-chevron ${isTipsSectionOpen ? 'open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          <span className="tips-title">Tips & Presets</span>
        </div>
        {isTipsSectionOpen && (
          <div className="tips-accordion-content">
            {/* Presets Section */}
            <div className="presets-section">
              <h4 className="presets-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                  <path d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8zm0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-1-5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM4 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm0 2.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
                </svg>
                Start with a preset
              </h4>
              <p className="presets-desc">Choose a common overflow scenario to get started quickly</p>
              <div className="presets-grid">
                {overflowPresets.map(preset => (
                  <button
                    key={preset.id}
                    className="preset-card"
                    onClick={() => applyPreset(preset.id)}
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-description">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tips-divider" />

            <h4 className="tips-subtitle">Tips</h4>
            <ul className="tips-list">
              <li>Please ensure that the attribute values used in the prompt accurately correspond to the selected context variable.</li>
              <li>Custom overflow rules will not apply to queues with predefined overflow logic.</li>
              <li>Please ensure that the queues referenced in the prompt contain at least one member.</li>
              <li>Minimum wait time threshold is 30 seconds.</li>
              <li>You can combine multiple overflow conditions using OR logic within a single rule.</li>
            </ul>
            <div className="tips-example">
              <strong>Example:</strong>
              <pre className="tips-example-text">{examplePlaybook}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Template Section - Always visible */}
      <div className="template-output-section-main">
        <div className="template-instruction">
          Click on the <span className="highlight-text">blue dropdowns</span> below to start editing. Then Save or Publish your policy.
        </div>

        <div className="template-output">
          {/* Variable Declaration - only shown if variables selected */}
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
          {branches.map((branch, branchIndex) => {
            const activeVariables = allSelectedVariables.filter(
              v => !(branch.disabledVariables || []).includes(v.id)
            );
            const disabledVariables = allSelectedVariables.filter(
              v => (branch.disabledVariables || []).includes(v.id)
            );
            const currentAction = overflowActionOptions.find(a => a.id === branch.actionId);
            const isFirstBranch = branchIndex === 0;

            return (
              <div key={branch.id} className="template-line overflow-single-line">
                {/* Customer condition part */}
                {activeVariables.length > 0 ? (
                  <>
                    For customers where{' '}
                    {activeVariables.map((v, varIdx) => (
                      <React.Fragment key={v.id}>
                        {varIdx > 0 && ' and '}
                        <span className="variable-condition">
                          <button
                            className="variable-toggle-btn"
                            onClick={() => toggleVariableForBranch(branch.id, v.id)}
                            title="Click to disable this variable for this rule"
                          >×</button>
                          {v.description || v.label}{' '}
                          is{' '}
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

                {/* Overflow Conditions - Single clickable box with conditions and values */}
                {branch.overflowConditionExcludeMode && (
                  <span className="condition-text-static">all conditions <strong>except</strong> </span>
                )}
                <OverflowConditionMultiSelect
                  selectedIds={branch.selectedConditionIds}
                  excludeMode={branch.overflowConditionExcludeMode}
                  conditionValues={branch.conditionValues}
                  onSelectionChange={(selectedIds) => {
                    setBranches(prev => prev.map(b => {
                      if (b.id === branch.id) {
                        // Initialize default values for newly selected conditions
                        const newConditionValues = { ...b.conditionValues };
                        selectedIds.forEach(condId => {
                          const option = overflowConditionOptions.find(o => o.id === condId);
                          if (option?.requiresValue && !(condId in newConditionValues)) {
                            newConditionValues[condId] = option.valueType === 'number' ? 10 : 5;
                          }
                        });
                        // Remove values for deselected conditions
                        Object.keys(newConditionValues).forEach(key => {
                          if (!selectedIds.includes(key)) {
                            delete newConditionValues[key];
                          }
                        });
                        return {
                          ...b,
                          selectedConditionIds: selectedIds,
                          conditionValues: newConditionValues
                        };
                      }
                      return b;
                    }));
                  }}
                  onExcludeModeChange={(exclude) => {
                    setBranches(prev => prev.map(b =>
                      b.id === branch.id ? { ...b, overflowConditionExcludeMode: exclude } : b
                    ));
                  }}
                  onValueChange={(conditionId, value) => handleConditionValueChange(branch.id, conditionId, value)}
                  hasError={hasError(branch.id, 'conditions')}
                />

                {/* Action */}
                <span className="action-arrow">→</span>
                <select
                  className="template-dropdown action-dropdown"
                  value={branch.actionId}
                  onChange={(e) => handleActionChange(branch.id, e.target.value)}
                >
                  <option value="">select overflow action</option>
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

                {/* Add/Remove buttons */}
                <span className="rule-actions">
                  <button
                    className="inline-add-btn"
                    onClick={addBranch}
                    title="Add rule after this"
                  >+</button>
                  {!isFirstBranch && (
                    <button
                      className="inline-remove-btn"
                      onClick={() => removeBranch(branch.id)}
                      title="Remove this rule"
                    >×</button>
                  )}
                </span>
              </div>
            );
          })}
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

        {/* Generated Policy Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Generated Policy</h4>
          <pre className="generated-policy-text">{generateFinalPrompt()}</pre>
        </div>
      </div>

      {/* Optional: Add Variables Section - Collapsible */}
      <div className="variables-accordion">
        <div
          className="variables-accordion-header"
          onClick={() => setIsVariablesSectionOpen(!isVariablesSectionOpen)}
        >
          <span className={`variables-chevron ${isVariablesSectionOpen ? 'open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          <span className="variables-title">Add Variables (Optional)</span>
          {allSelectedVariables.length > 0 && (
            <span className="variables-count">{allSelectedVariables.length} selected</span>
          )}
        </div>
        {isVariablesSectionOpen && (
          <div className="variables-accordion-content">
            <p className="variables-desc">
              Add variables to create conditional overflow rules based on customer or conversation attributes.
            </p>

            <div className="variables-grid">
              {/* Context Variables */}
              <div className="variable-category">
                <h4 className="category-title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  Customer Attributes
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
                          placeholder={`Describe how this appears (e.g., "${v.label.toLowerCase()}")`}
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
                  Conversation Attributes
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
                          placeholder={`Describe how this appears (e.g., "${v.label.toLowerCase()}")`}
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
    </div>
  );
};

export default OverflowHandlingEditor;
