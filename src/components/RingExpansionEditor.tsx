/**
 * Ring Expansion Editor - Specialized template editor for ring expansion scenarios
 *
 * IMPORTANT: For creating new template editors or modifying this one,
 * refer to the Template Editor Guide: src/components/TEMPLATE_EDITOR_GUIDE.md
 *
 * This editor follows the standard template structure documented in the guide.
 */

import React, { useState } from 'react';
import './TemplateBasedEditor.css';

// User groups data
const userGroups = [
  { id: 'ug1', name: 'Senior Support Agents' },
  { id: 'ug2', name: 'Technical Specialists' },
  { id: 'ug3', name: 'Standard Support Team' },
  { id: 'ug4', name: 'Escalation Team' },
  { id: 'ug5', name: 'VIP Support Team' },
  { id: 'ug6', name: 'Billing Specialists' },
  { id: 'ug7', name: 'Fraud Prevention Team' },
  { id: 'ug8', name: 'Account Management Team' },
];

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

const waitTimeOptions = [15, 30, 45, 60, 90, 120, 180, 300];

// Example Playbook for Ring Expansion
const examplePlaybook = `Assign the conversations to Senior Support Agents or Technical Specialists.
If no support representative is available or the conversation remains unassigned for 30 seconds, expand to Standard Support Team.
If the conversation is still unassigned after 60 seconds, expand to Escalation Team.
Do not open the conversation to any other users in the queue.`;

interface SelectedVariable {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface ExpansionRule {
  id: string;
  waitTimeSeconds: number;
  userGroupIds: string[];
}

interface RingExpansionBranch {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  initialUserGroups: string[];
  expansionRules: ExpansionRule[];
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
export interface RingExpansionBranchState {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  initialUserGroups: string[];
  expansionRules: ExpansionRule[];
}

export interface SelectedVariableState {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

export interface RingExpansionEditorState {
  branches: RingExpansionBranchState[];
  selectedContextVars: SelectedVariableState[];
  selectedLWIVars: SelectedVariableState[];
  scenarioId?: string;
}

interface RingExpansionEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  initialState?: RingExpansionEditorState;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
  onStateChange?: (state: RingExpansionEditorState, prompt: string) => void;
}

// Multi-Select Dropdown Component (same as TemplateBasedEditor)
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

const RingExpansionEditor: React.FC<RingExpansionEditorProps> = ({
  scenarioId,
  initialRequirement,
  initialState,
  onPromptGenerated,
  onStateChange
}) => {
  const isRestrictedFallback = scenarioId === 'ring-expansion-restricted';

  // Create default branch helper function with sensible defaults
  const createDefaultBranch = (index: number): RingExpansionBranch => ({
    id: `branch-${index}`,
    variableValues: {},
    variableExcludeMode: {},
    disabledVariables: [],
    initialUserGroups: ['ug1'],
    expansionRules: [
      { id: `expansion-${index}-0`, waitTimeSeconds: 30, userGroupIds: ['ug3'] }
    ]
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
  const [branches, setBranches] = useState<RingExpansionBranch[]>(() => {
    if (initialState?.branches && initialState.branches.length > 0) {
      return initialState.branches.map(b => ({
        id: b.id,
        variableValues: b.variableValues || {},
        variableExcludeMode: b.variableExcludeMode || {},
        disabledVariables: b.disabledVariables || [],
        initialUserGroups: b.initialUserGroups || [],
        expansionRules: b.expansionRules || [{ id: `expansion-${b.id}-0`, waitTimeSeconds: 30, userGroupIds: [] }]
      }));
    }
    return [createDefaultBranch(0)];
  });

  // Section collapse states
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(() => {
    return (initialState?.selectedContextVars?.length || 0) > 0 || (initialState?.selectedLWIVars?.length || 0) > 0;
  });
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);

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

  const handleInitialUserGroupsChange = (branchId: string, userGroupIds: string[]) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return { ...branch, initialUserGroups: userGroupIds };
      }
      return branch;
    }));
  };

  const handleExpansionUserGroupsChange = (branchId: string, ruleId: string, userGroupIds: string[]) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          expansionRules: branch.expansionRules.map(rule =>
            rule.id === ruleId ? { ...rule, userGroupIds } : rule
          )
        };
      }
      return branch;
    }));
  };

  const handleExpansionWaitTimeChange = (branchId: string, ruleId: string, waitTime: number) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          expansionRules: branch.expansionRules.map(rule =>
            rule.id === ruleId ? { ...rule, waitTimeSeconds: waitTime } : rule
          )
        };
      }
      return branch;
    }));
  };

  const addExpansionRule = (branchId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId && branch.expansionRules.length < 4) {
        const newRule: ExpansionRule = {
          id: `expansion-${branchId}-${Date.now()}`,
          waitTimeSeconds: 60,
          userGroupIds: []
        };
        return {
          ...branch,
          expansionRules: [...branch.expansionRules, newRule]
        };
      }
      return branch;
    }));
  };

  const removeExpansionRule = (branchId: string, ruleId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId && branch.expansionRules.length > 1) {
        return {
          ...branch,
          expansionRules: branch.expansionRules.filter(rule => rule.id !== ruleId)
        };
      }
      return branch;
    }));
  };

  const addBranch = () => {
    const newBranch: RingExpansionBranch = {
      id: `branch-${Date.now()}`,
      variableValues: {},
      variableExcludeMode: {},
      disabledVariables: [],
      initialUserGroups: [],
      expansionRules: [
        { id: `expansion-new-0`, waitTimeSeconds: 30, userGroupIds: [] }
      ]
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
  };

  const getUserGroupName = (id: string) => {
    const group = userGroups.find(g => g.id === id);
    return group?.name || '';
  };

  const formatWaitTime = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${seconds} seconds`;
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

      const conditionParts = activeVariables.map(v => {
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

      const conditionText = conditionParts.length > 0 ? conditionParts.join(' and ') : '';

      const initialGroups = branch.initialUserGroups.map(id => getUserGroupName(id));
      const initialGroupsText = initialGroups.length > 0 ? initialGroups.join(' or ') : '[choose user group]';

      if (conditionText) {
        lines.push(`For customers where ${conditionText}, assign to ${initialGroupsText}.`);
      } else {
        lines.push(`Assign the conversations to ${initialGroupsText}.`);
      }

      branch.expansionRules.forEach((rule, ruleIdx) => {
        const groupNames = rule.userGroupIds.map(id => getUserGroupName(id)).filter(Boolean);
        const groupNamesText = groupNames.length > 0 ? groupNames.join(' or ') : '[choose user group(s)]';
        const waitText = formatWaitTime(rule.waitTimeSeconds);

        if (ruleIdx === 0) {
          lines.push(`If no support representative is available or the conversation remains unassigned for ${waitText}, expand to ${groupNamesText}.`);
        } else {
          lines.push(`If the conversation is still unassigned after ${waitText}, expand to ${groupNamesText}.`);
        }
      });
    });

    if (isRestrictedFallback) {
      lines.push('Do not open the conversation to any other users in the queue.');
    } else {
      lines.push('If the conversation still remains unassigned, assign to any member of the queue.');
    }

    return lines.join('\n\n');
  };

  // Notify parent of state changes for persistence
  React.useEffect(() => {
    if (onStateChange) {
      const currentState: RingExpansionEditorState = {
        branches: branches.map(b => ({
          id: b.id,
          variableValues: b.variableValues,
          variableExcludeMode: b.variableExcludeMode,
          disabledVariables: b.disabledVariables,
          initialUserGroups: b.initialUserGroups,
          expansionRules: b.expansionRules
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
      if (branch.initialUserGroups.length === 0) {
        errors.push({
          branchId: branch.id,
          fieldId: 'initialUserGroups',
          message: `Rule ${branchIndex + 1}: Please select initial user group(s)`
        });
      }

      branch.expansionRules.forEach((rule, ruleIndex) => {
        if (rule.userGroupIds.length === 0) {
          errors.push({
            branchId: branch.id,
            fieldId: rule.id,
            message: `Rule ${branchIndex + 1}: Please select user group(s) for expansion rule ${ruleIndex + 1}`
          });
        }
      });
    });

    return errors;
  };

  const hasError = (branchId: string, fieldId: string): boolean => {
    return validationErrors.some(e => e.branchId === branchId && e.fieldId === fieldId);
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
          <span className="tips-title">Tips for this policy</span>
        </div>
        {isTipsSectionOpen && (
          <div className="tips-accordion-content">
            <ul className="tips-list">
              <li>Add variables from the section below to create advanced conditions based on customer or conversation attributes.</li>
              <li>This policy will only apply to queues associated with the profiles you select.</li>
              <li>Ring expansion rules are evaluated in order - define more specific rules first.</li>
              <li>You can add multiple expansion tiers with different wait times using the + button.</li>
              <li>The {isRestrictedFallback ? 'restricted' : 'open'} fallback determines what happens if no agents are found after all expansion tiers.</li>
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

          {/* Condition Branches */}
          {branches.map((branch) => {
            const activeVariables = allSelectedVariables.filter(
              v => !(branch.disabledVariables || []).includes(v.id)
            );
            const disabledVariables = allSelectedVariables.filter(
              v => (branch.disabledVariables || []).includes(v.id)
            );

            return (
              <React.Fragment key={branch.id}>
                {/* Main condition line */}
                <div className="template-line condition-line">
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
                              title="Click to disable this variable for this branch"
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
                      , assign to{' '}
                    </>
                  ) : (
                    <>Assign the conversations to{' '}</>
                  )}
                  <MultiSelectDropdown
                    options={userGroups.map(g => g.name)}
                    selected={branch.initialUserGroups.map(id => getUserGroupName(id)).filter(Boolean)}
                    onChange={(selectedNames) => {
                      const selectedIds = selectedNames.map(name => userGroups.find(g => g.name === name)?.id).filter(Boolean) as string[];
                      handleInitialUserGroupsChange(branch.id, selectedIds);
                      if (selectedIds.length > 0) {
                        setValidationErrors(prev => prev.filter(err => !(err.branchId === branch.id && err.fieldId === 'initialUserGroups')));
                      }
                    }}
                    placeholder="choose user group(s)"
                    hasError={hasError(branch.id, 'initialUserGroups')}
                  />.
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

                {/* Expansion Rules */}
                {branch.expansionRules.map((rule, ruleIdx) => (
                  <div key={rule.id} className="template-line fallback-line">
                    {ruleIdx === 0 ? (
                      <>If no support representative is available or the conversation remains unassigned for{' '}</>
                    ) : (
                      <>If the conversation is still unassigned after{' '}</>
                    )}
                    <select
                      className="template-dropdown small"
                      value={rule.waitTimeSeconds}
                      onChange={(e) => handleExpansionWaitTimeChange(branch.id, rule.id, parseInt(e.target.value))}
                    >
                      {waitTimeOptions.map(seconds => (
                        <option key={seconds} value={seconds}>
                          {formatWaitTime(seconds)}
                        </option>
                      ))}
                    </select>
                    , expand to{' '}
                    <MultiSelectDropdown
                      options={userGroups.map(g => g.name)}
                      selected={rule.userGroupIds.map(id => getUserGroupName(id)).filter(Boolean)}
                      onChange={(selectedNames) => {
                        const selectedIds = selectedNames.map(name => userGroups.find(g => g.name === name)?.id).filter(Boolean) as string[];
                        handleExpansionUserGroupsChange(branch.id, rule.id, selectedIds);
                        if (selectedIds.length > 0) {
                          setValidationErrors(prev => prev.filter(err => !(err.branchId === branch.id && err.fieldId === rule.id)));
                        }
                      }}
                      placeholder="choose user group(s)"
                      hasError={hasError(branch.id, rule.id)}
                    />.
                    {branch.expansionRules.length < 4 && (
                      <button
                        className="inline-add-btn"
                        onClick={() => addExpansionRule(branch.id)}
                        title="Add expansion rule (max 4)"
                      >+</button>
                    )}
                    {branch.expansionRules.length > 1 && (
                      <button
                        className="inline-remove-btn"
                        onClick={() => removeExpansionRule(branch.id, rule.id)}
                        title="Remove this expansion rule"
                      >×</button>
                    )}
                  </div>
                ))}
              </React.Fragment>
            );
          })}

          {/* Default Fallback */}
          <div className="template-line default-fallback">
            {isRestrictedFallback
              ? 'Do not open the conversation to any other users in the queue.'
              : 'If the conversation still remains unassigned, assign to any member of the queue.'
            }
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

        {/* Generated Playbook Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Generated Playbook</h4>
          <pre className="generated-policy-text">{generateFinalPrompt()}</pre>
        </div>
      </div>

      {/* Variables (Optional) - Collapsible Accordion at bottom */}
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
          <span className="variables-title">Variables (Optional)</span>
          {allSelectedVariables.length > 0 && (
            <span className="variables-count">{allSelectedVariables.length} selected</span>
          )}
        </div>
        {isVariablesSectionOpen && (
          <div className="variables-accordion-content">
            <p className="variables-desc">
              Add variables to create conditional ring expansion rules for specific customers or conversations.
            </p>

            <div className="variables-grid-inline">
              {/* Context Variables */}
              <div className="variable-category-inline">
                <h4 className="category-title-inline">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  Customer Attributes
                </h4>

                {selectedContextVars.length > 0 && (
                  <div className="selected-variables-inline">
                    {selectedContextVars.map(v => (
                      <div key={v.id} className="selected-variable-chip-inline">
                        <span>{v.label}</span>
                        <button
                          className="remove-var-btn-inline"
                          onClick={() => removeContextVariable(v.id)}
                          title="Remove"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {availableContextVars.length > 0 && (
                  <select
                    className="add-variable-dropdown-inline"
                    value=""
                    onChange={(e) => addContextVariable(e.target.value)}
                  >
                    <option value="">+ Add...</option>
                    {availableContextVars.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Live Work Item Variables */}
              <div className="variable-category-inline">
                <h4 className="category-title-inline">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Conversation Attributes
                </h4>

                {selectedLWIVars.length > 0 && (
                  <div className="selected-variables-inline">
                    {selectedLWIVars.map(v => (
                      <div key={v.id} className="selected-variable-chip-inline">
                        <span>{v.label}</span>
                        <button
                          className="remove-var-btn-inline"
                          onClick={() => removeLWIVariable(v.id)}
                          title="Remove"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {availableLWIVars.length > 0 && (
                  <select
                    className="add-variable-dropdown-inline"
                    value=""
                    onChange={(e) => addLWIVariable(e.target.value)}
                  >
                    <option value="">+ Add...</option>
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

export default RingExpansionEditor;
