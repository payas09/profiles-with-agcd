/**
 * Overflow Handling Editor - Specialized template editor for overflow scenarios
 *
 * IMPORTANT: For creating new template editors or modifying this one,
 * refer to the Template Editor Guide: src/components/TEMPLATE_EDITOR_GUIDE.md
 *
 * This editor follows the standard template structure documented in the guide.
 */

import React, { useState, useEffect } from 'react';
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

// Context variables for additional filtering with workstream names
const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', workstream: 'Premium Support - Voice', values: ['True', 'False'] },
  { id: 'CustomerTier', label: 'Customer Tier', workstream: 'General Support - Voice', values: ['Gold', 'Silver', 'Bronze', 'Standard', 'Platinum', 'Diamond', 'Enterprise', 'SMB', 'Startup'] },
  { id: 'Language', label: 'Preferred Language', workstream: 'Chat Support - Messaging', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese'] },
  { id: 'Region', label: 'Customer Region', workstream: 'Regional Support - Voice', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'] },
  { id: 'AccountType', label: 'Account Type', workstream: 'Account Services - Messaging', values: ['Premium', 'Standard', 'Trial', 'Free', 'Enterprise', 'Government', 'Education'] },
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
  { id: 'no-agents-available', label: 'no agents are available', requiresValue: false },
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
  isPublicPreview?: boolean; // When true, shows static condition instead of dropdown
  triggerValidation?: boolean; // When true, run validation
  onValidationResult?: (hasErrors: boolean, errors: { message: string }[]) => void; // Callback with validation result
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
  onStateChange,
  isPublicPreview = false,
  triggerValidation = false,
  onValidationResult
}) => {
  // Create default branch helper function with sensible defaults
  // For public preview, always use 'no-agents-available' as the only condition
  const createDefaultBranch = (index: number): OverflowBranch => ({
    id: `branch-${index}`,
    variableValues: {},
    variableExcludeMode: {},
    disabledVariables: [],
    selectedConditionIds: isPublicPreview ? ['no-agents-available'] : ['estimated-wait-time'],
    conditionValues: isPublicPreview ? {} : { 'estimated-wait-time': 5 },
    overflowConditionExcludeMode: false,
    actionId: 'transfer-queue',
    actionValue: 'q8'
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
    return [createDefaultBranch(0)];
  });

  // Section collapse states - open Variables section if we have variables from restored state
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(() => {
    return (initialState?.selectedContextVars?.length || 0) > 0 || (initialState?.selectedLWIVars?.length || 0) > 0;
  });
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);


  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; fieldId: string; message: string }[]>([]);

  // Public preview limitation popups
  const [showVariableLimitPopup, setShowVariableLimitPopup] = useState(false);
  const [showBranchLimitPopup, setShowBranchLimitPopup] = useState(false);

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

    // Public preview: limit to 2 customer variables
    if (isPublicPreview && selectedContextVars.length >= 2) {
      setShowVariableLimitPopup(true);
      return;
    }

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
    // Public preview: limit to 12 branches
    if (isPublicPreview && branches.length >= 12) {
      setShowBranchLimitPopup(true);
      return;
    }
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
      if (isPublicPreview) {
        // Public preview: always use static condition
        overflowConditionText = 'no agents are available';
      } else if (branch.overflowConditionExcludeMode) {
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
        if (isPublicPreview) {
          conditionText = `For customers where ${customerConditionParts.join(' AND ')} and ${overflowConditionText}`;
        } else if (branch.overflowConditionExcludeMode) {
          conditionText = `For customers where ${customerConditionParts.join(' AND ')} and ${overflowConditionText}`;
        } else {
          conditionText = `For customers where ${customerConditionParts.join(' AND ')} and (${overflowConditionText})`;
        }
      } else {
        if (isPublicPreview) {
          conditionText = `For all customers where ${overflowConditionText}`;
        } else if (branch.overflowConditionExcludeMode) {
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

  // Helper to get a normalized condition signature for comparison
  const getConditionSignature = (branch: OverflowBranch): string => {
    const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));
    if (activeVars.length === 0) {
      return 'ALL_CUSTOMERS';
    }

    const varParts = activeVars.map(v => {
      const values = branch.variableValues[v.id] || [];
      const sortedValues = [...values].sort().join(',');
      return `${v.id}:${sortedValues}`;
    }).sort();

    return varParts.join('|');
  };

  // Helper to get action signature
  const getActionSignature = (branch: OverflowBranch): string => {
    return `${branch.actionId}:${branch.actionValue || ''}`;
  };

  // Helper to check if one condition is a subset of another
  const isConditionSubset = (branch1: OverflowBranch, branch2: OverflowBranch): boolean => {
    const activeVars1 = allSelectedVariables.filter(v => !(branch1.disabledVariables || []).includes(v.id));
    const activeVars2 = allSelectedVariables.filter(v => !(branch2.disabledVariables || []).includes(v.id));

    // If branch1 has no conditions (all customers), it's a superset of everything
    if (activeVars1.length === 0) return false;
    // If branch2 has no conditions but branch1 does, branch1 is a subset
    if (activeVars2.length === 0 && activeVars1.length > 0) return true;

    // Check if all variables in branch1 are also in branch2 with same or subset values
    for (const v of activeVars1) {
      const values1 = branch1.variableValues[v.id] || [];
      const values2 = branch2.variableValues[v.id] || [];

      // If branch2 doesn't have this variable active, branch1 is more specific
      if (!activeVars2.find(av => av.id === v.id)) {
        continue; // branch1 is more specific on this variable
      }

      // Check if values1 is a subset of values2
      if (values1.length > 0 && values2.length > 0) {
        const isSubset = values1.every(val => values2.includes(val));
        if (!isSubset && values1.join(',') !== values2.join(',')) {
          return false; // Values don't overlap properly
        }
      }
    }

    // branch1 has more or equal variables than branch2, so it's more specific (subset)
    return activeVars1.length > activeVars2.length;
  };

  // Helper to check if conditions overlap
  const doConditionsOverlap = (branch1: OverflowBranch, branch2: OverflowBranch): boolean => {
    const activeVars1 = allSelectedVariables.filter(v => !(branch1.disabledVariables || []).includes(v.id));
    const activeVars2 = allSelectedVariables.filter(v => !(branch2.disabledVariables || []).includes(v.id));

    // If either has no conditions (all customers), they overlap
    if (activeVars1.length === 0 || activeVars2.length === 0) return true;

    // Check if there's any overlap in the variable values
    for (const v of activeVars1) {
      const var2 = activeVars2.find(av => av.id === v.id);
      if (var2) {
        const values1 = branch1.variableValues[v.id] || [];
        const values2 = branch2.variableValues[v.id] || [];

        if (values1.length > 0 && values2.length > 0) {
          // Check if there's any common value
          const hasCommon = values1.some(val => values2.includes(val));
          if (!hasCommon) {
            return false; // No overlap on this variable
          }
        }
      }
    }

    return true;
  };

  // Helper to describe a branch's conditions
  const describeBranchConditions = (branch: OverflowBranch, branchIndex: number): string => {
    const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));
    if (activeVars.length === 0) {
      return `Condition ${branchIndex + 1}: "For all customers"`;
    }

    const parts = activeVars.map(v => {
      const values = branch.variableValues[v.id] || [];
      return `${v.label} = ${values.join(', ') || 'any'}`;
    });

    return `Condition ${branchIndex + 1}: "${parts.join(' AND ')}"`;
  };

  // Helper to validate phone number format
  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return false;
    // Allow common phone formats: +1-800-XXX-XXXX, (123) 456-7890, 123-456-7890, +44 20 1234 5678, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
    // Must have at least 7 digits
    return phoneRegex.test(phone) || (cleanPhone.length >= 7 && /^[\+]?[0-9]+$/.test(cleanPhone));
  };

  const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
    const errors: { branchId: string; fieldId: string; message: string }[] = [];

    branches.forEach((branch, branchIndex) => {
      const conditionLabel = `Condition ${branchIndex + 1}`;

      // For public preview, condition is static - no validation needed
      // For regular flow, validate condition selection
      if (!isPublicPreview) {
        if (branch.selectedConditionIds.length === 0) {
          errors.push({
            branchId: branch.id,
            fieldId: 'conditions',
            message: branch.overflowConditionExcludeMode
              ? `${conditionLabel}: Please select at least one condition to exclude.`
              : `${conditionLabel}: Please select at least one overflow condition.`
          });
        } else if (!branch.overflowConditionExcludeMode) {
          // Only validate values for include mode (exclude mode doesn't need values)
          branch.selectedConditionIds.forEach((condId) => {
            const option = overflowConditionOptions.find(o => o.id === condId);
            if (option?.requiresValue && !branch.conditionValues[condId]) {
              errors.push({
                branchId: branch.id,
                fieldId: condId,
                message: `${conditionLabel}: Please enter a value for "${option.label}".`
              });
            }
          });
        }
      }

      // Validate action is selected
      if (!branch.actionId) {
        errors.push({
          branchId: branch.id,
          fieldId: 'action',
          message: `${conditionLabel}: Please select an overflow action.`
        });
      } else {
        // Validate action has value where required
        const action = overflowActionOptions.find(a => a.id === branch.actionId);
        if (action?.requiresValue) {
          if (!branch.actionValue || branch.actionValue.trim() === '') {
            errors.push({
              branchId: branch.id,
              fieldId: 'action-value',
              message: `${conditionLabel}: Please ${action.valueType === 'queue' ? 'select a queue' : 'enter a value'} for the action.`
            });
          } else if (branch.actionId === 'transfer-external') {
            // Validate phone number for transfer to external number
            if (!isValidPhoneNumber(branch.actionValue)) {
              errors.push({
                branchId: branch.id,
                fieldId: 'invalid-phone',
                message: `${conditionLabel}: Please enter a valid phone number for "Transfer to external number". Current value: ${branch.actionValue}`
              });
            }
          }
        }
      }

      // Check that selected variables have values
      const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));
      activeVars.forEach(v => {
        const values = branch.variableValues[v.id] || [];
        const hasValues = values.length > 0 && values.some(val => val.trim() !== '');
        if (!hasValues) {
          errors.push({
            branchId: branch.id,
            fieldId: `blank-var-${v.id}`,
            message: `${conditionLabel}: Value for "${v.label}" is required.`
          });
        }
      });
    });

    // Check for duplicate and conflicting rules
    const checkedPairs = new Set<string>();

    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const pairKey = `${i}-${j}`;
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const branch1 = branches[i];
        const branch2 = branches[j];

        const condSig1 = getConditionSignature(branch1);
        const condSig2 = getConditionSignature(branch2);
        const actionSig1 = getActionSignature(branch1);
        const actionSig2 = getActionSignature(branch2);

        const conditionsMatch = condSig1 === condSig2;
        const actionsMatch = actionSig1 === actionSig2;

        // Check for exact duplicates
        if (conditionsMatch && actionsMatch) {
          errors.push({
            branchId: branch2.id,
            fieldId: 'duplicate',
            message: `Duplicate condition detected: ${describeBranchConditions(branch1, i)} and ${describeBranchConditions(branch2, j)} have identical conditions and actions. Please remove one of them.`
          });
          continue;
        }

        // Check for conflicting conditions (same conditions, different actions)
        if (conditionsMatch && !actionsMatch) {
          const action1 = overflowActionOptions.find(a => a.id === branch1.actionId);
          const action2 = overflowActionOptions.find(a => a.id === branch2.actionId);
          errors.push({
            branchId: branch2.id,
            fieldId: 'conflict',
            message: `Conflicting conditions detected: ${describeBranchConditions(branch1, i)} and ${describeBranchConditions(branch2, j)} have the same conditions but different actions (${action1?.label || 'unknown'} vs ${action2?.label || 'unknown'}). This creates ambiguity about which action to take.`
          });
          continue;
        }

        // Check for subset/superset conflicts (one condition is more specific than another with different action)
        if (doConditionsOverlap(branch1, branch2) && !actionsMatch) {
          const isSubset1of2 = isConditionSubset(branch1, branch2);
          const isSubset2of1 = isConditionSubset(branch2, branch1);

          if (isSubset1of2 || isSubset2of1) {
            const moreSpecific = isSubset1of2 ? branch1 : branch2;
            const moreGeneral = isSubset1of2 ? branch2 : branch1;
            const moreSpecificIdx = isSubset1of2 ? i : j;
            const moreGeneralIdx = isSubset1of2 ? j : i;

            const action1 = overflowActionOptions.find(a => a.id === moreSpecific.actionId);
            const action2 = overflowActionOptions.find(a => a.id === moreGeneral.actionId);

            errors.push({
              branchId: branch2.id,
              fieldId: 'overlap',
              message: `Overlapping conditions detected: ${describeBranchConditions(moreSpecific, moreSpecificIdx)} is a subset of ${describeBranchConditions(moreGeneral, moreGeneralIdx)}, but they have different actions (${action1?.label || 'unknown'} vs ${action2?.label || 'unknown'}). Consider consolidating these conditions or ensuring they are mutually exclusive.`
            });
          }
        }
      }
    }

    return errors;
  };

  // Trigger validation when parent requests it (on Save/Publish)
  useEffect(() => {
    if (triggerValidation) {
      const errors = validateBranches();
      setValidationErrors(errors);
      if (onValidationResult) {
        onValidationResult(errors.length > 0, errors);
      }
    }
  }, [triggerValidation]);

  // Clear validation errors when user makes changes (so they can try again)
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [branches]);

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
          <span className="tips-title">Tips</span>
        </div>
        {isTipsSectionOpen && (
          <div className="tips-accordion-content">
            {/* Presets Section - Only show for non-public-preview */}
            {!isPublicPreview && (
              <>
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
              </>
            )}

            <h4 className="tips-subtitle">Tips</h4>
            <ul className="tips-list">
              <li>Please ensure that the attribute values used in the prompt accurately correspond to the selected context variable.</li>
              <li>Custom overflow rules will not apply to queues with predefined overflow logic.</li>
              <li>Please ensure that the queues referenced in the prompt contain at least one member.</li>
              <li>Minimum wait time threshold is 30 seconds.</li>
              <li>{isPublicPreview ? 'The overflow condition triggers when no agents are available.' : 'You can combine multiple overflow conditions using OR logic within a single rule.'}</li>
            </ul>
            <div className="tips-example">
              <strong>Example:</strong>
              <pre className="tips-example-text">{isPublicPreview
                ? `For VIP customers where no agents are available, transfer to VIP Support Queue.

For all other customers where no agents are available, offer direct callback.`
                : examplePlaybook}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Template Section - Always visible */}
      <div className="template-output-section-main">
        <div className="template-instruction">
          Click on the <span className="highlight-text">blue dropdowns</span> below to start editing. Optionally, add variables from the section below to create advanced conditions based on customer or conversation attributes. Then Save or Publish your policy.
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
                          <input
                            type="text"
                            className="variable-value-input"
                            placeholder="enter value"
                            value={(branch.variableValues[v.id] || []).join(', ')}
                            onChange={(e) => {
                              const textValue = e.target.value;
                              // Store as array with single value for compatibility
                              handleBranchValueChange(branch.id, v.id, textValue ? [textValue] : []);
                            }}
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

                {/* Overflow Condition - Static field for public preview, dropdown for regular */}
                {isPublicPreview ? (
                  <span className="overflow-condition-static">no agents are available</span>
                ) : (
                  <>
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
                  </>
                )}

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
                    className={`inline-add-btn ${isPublicPreview && branches.length >= 12 ? 'disabled' : ''}`}
                    onClick={addBranch}
                    title={isPublicPreview && branches.length >= 12 ? 'Maximum 12 branches allowed in public preview' : 'Add rule after this'}
                    disabled={isPublicPreview && branches.length >= 12}
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

        {/* Validation Warnings */}
        {validationErrors.length > 0 && (
          <div className="validation-warnings-section">
            <div className="validation-warnings-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Please review the following warnings:</span>
            </div>
            <ul className="validation-warnings-list-simple">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Generated Playbook Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Generated Playbook</h4>
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
                    className={`add-variable-dropdown ${isPublicPreview && selectedContextVars.length >= 2 ? 'disabled' : ''}`}
                    value=""
                    onChange={(e) => addContextVariable(e.target.value)}
                    disabled={isPublicPreview && selectedContextVars.length >= 2}
                    title={isPublicPreview && selectedContextVars.length >= 2 ? 'Maximum 2 customer variables allowed in public preview' : ''}
                  >
                    <option value="">{isPublicPreview && selectedContextVars.length >= 2 ? 'Maximum 2 variables reached' : '+ Add customer attribute...'}</option>
                    {availableContextVars.map(v => (
                      <option key={v.id} value={v.id}>{v.label} (Workstream: {v.workstream})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Live Work Item Variables - Hidden for public preview */}
              {!isPublicPreview && (
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variable Limit Popup for Public Preview */}
      {showVariableLimitPopup && (
        <div className="limitation-popup-overlay" onClick={() => setShowVariableLimitPopup(false)}>
          <div className="limitation-popup" onClick={(e) => e.stopPropagation()}>
            <div className="limitation-popup-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>Variable Limit Reached</h3>
            </div>
            <div className="limitation-popup-content">
              <p>In the public preview, you can add a maximum of <strong>2 customer variables</strong>.</p>
              <p className="limitation-details">
                This allows you to create up to 12 condition branches using combinations like:
              </p>
              <ul className="limitation-examples">
                <li>4 values × 3 values = 12 branches</li>
                <li>3 values × 4 values = 12 branches</li>
                <li>Or up to 12 values from a single variable</li>
              </ul>
              <p className="limitation-note">
                For more advanced configurations with additional variables, please contact your administrator.
              </p>
            </div>
            <div className="limitation-popup-actions">
              <button className="limitation-popup-btn" onClick={() => setShowVariableLimitPopup(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Limit Popup for Public Preview */}
      {showBranchLimitPopup && (
        <div className="limitation-popup-overlay" onClick={() => setShowBranchLimitPopup(false)}>
          <div className="limitation-popup" onClick={(e) => e.stopPropagation()}>
            <div className="limitation-popup-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>Branch Limit Reached</h3>
            </div>
            <div className="limitation-popup-content">
              <p>In the public preview, you can create a maximum of <strong>12 condition branches</strong>.</p>
              <p className="limitation-details">
                This limit supports common use cases such as:
              </p>
              <ul className="limitation-examples">
                <li>2 variables with 4×3 value combinations</li>
                <li>2 variables with 3×4 value combinations</li>
                <li>1 variable with up to 12 different values</li>
              </ul>
              <p className="limitation-note">
                For more complex routing rules with additional branches, please contact your administrator.
              </p>
            </div>
            <div className="limitation-popup-actions">
              <button className="limitation-popup-btn" onClick={() => setShowBranchLimitPopup(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverflowHandlingEditor;
