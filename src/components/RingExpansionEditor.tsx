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

interface RingExpansionEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
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
  onPromptGenerated
}) => {
  const isRestrictedFallback = scenarioId === 'ring-expansion-restricted';

  // Selected variables
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>([]);
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>([]);

  // Number of branches (default 2, range 1-5)
  const [numberOfBranches, setNumberOfBranches] = useState<number>(2);

  // Branch configuration
  const [branches, setBranches] = useState<RingExpansionBranch[]>([]);

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
    const generatedBranches: RingExpansionBranch[] = [];
    for (let i = 0; i < numberOfBranches; i++) {
      generatedBranches.push({
        id: `branch-${i}`,
        variableValues: {},
        variableExcludeMode: {},
        disabledVariables: [],
        initialUserGroups: [],
        expansionRules: [
          { id: `expansion-${i}-0`, waitTimeSeconds: 30, userGroupIds: [] }
        ]
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

      const conditionText = conditionParts.length > 0 ? conditionParts.join(' AND ') : '';

      const initialGroups = branch.initialUserGroups.map(id => getUserGroupName(id));
      const initialGroupsText = initialGroups.length > 0 ? initialGroups.join(' or ') : '[choose user group]';

      if (conditionText) {
        lines.push(`For Customer where ${conditionText}, assign to ${initialGroupsText}.`);
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

    return lines.join('\n');
  };

  const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
    const errors: { branchId: string; fieldId: string; message: string }[] = [];

    branches.forEach((branch, branchIndex) => {
      if (branch.initialUserGroups.length === 0) {
        errors.push({
          branchId: branch.id,
          fieldId: 'initialUserGroups',
          message: `Branch ${branchIndex + 1}: Please select initial user group(s)`
        });
      }

      branch.expansionRules.forEach((rule, ruleIndex) => {
        if (rule.userGroupIds.length === 0) {
          errors.push({
            branchId: branch.id,
            fieldId: rule.id,
            message: `Branch ${branchIndex + 1}: Please select user group(s) for expansion rule ${ruleIndex + 1}`
          });
        }
      });
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
          <span>Example Playbook - Ring Expansion ({isRestrictedFallback ? 'Restricted' : 'Open'} Fallback)</span>
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
              Optionally select variables to create conditional ring expansion rules. Skip this if you want the same expansion logic for all conversations.
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
                          placeholder={`Describe how this appears in policy (e.g., "${v.label.toLowerCase()}")`}
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
                          placeholder={`Describe how this appears in policy (e.g., "${v.label.toLowerCase()}")`}
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
            <h3 className="section-title">Configure Condition Branches</h3>
            {!isBranchesSectionOpen && numberOfBranches > 0 && (
              <span className="section-summary">
                {numberOfBranches} branch{numberOfBranches > 1 ? 'es' : ''}
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
              Enter the number of condition branches. Each branch defines a ring expansion rule with initial assignment and time-based expansion.
            </p>

            <div className="branch-number-input-group">
              <label className="branch-number-label">Number of condition branches:</label>
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
              <h5 className="example-title">What are ring expansion branches?</h5>
              <p className="example-desc">
                Each branch defines initial user group assignment and how it expands over time:
              </p>
              <ul className="example-list">
                <li><strong>Initial:</strong> Assign to Senior Support Agents</li>
                <li><strong>After 30s:</strong> Expand to Standard Support Team</li>
                <li><strong>After 60s:</strong> Expand to Escalation Team</li>
              </ul>
              <p className="example-note">You can add multiple expansion rules with the + button after generating.</p>
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
              <h3 className="section-title">Generated Policy Template</h3>
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
              Fill in the <span className="highlight-text">blue dropdowns</span> to customize your ring expansion policy.
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
                          For Customer where{' '}
                          {activeVariables.map((v, varIdx) => (
                            <React.Fragment key={v.id}>
                              {varIdx > 0 && ' AND '}
                              <span className="variable-condition">
                                <button
                                  className="variable-toggle-btn"
                                  onClick={() => toggleVariableForBranch(branch.id, v.id)}
                                  title="Click to disable this variable for this branch"
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
                        title="Add branch after this"
                      >+</button>
                      {branches.length > 1 && (
                        <button
                          className="inline-remove-btn"
                          onClick={() => removeBranch(branch.id)}
                          title="Remove this branch"
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

            {/* Apply Button */}
            <div className="template-actions">
              <button className="apply-template-btn" onClick={handleApplyTemplate}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Apply Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RingExpansionEditor;
