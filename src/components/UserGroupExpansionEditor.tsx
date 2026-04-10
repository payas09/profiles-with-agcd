/**
 * User Group Expansion Editor - Specialized template editor for user group expansion scenarios
 *
 * This editor allows users to configure progressive assignment to user groups
 * with a configurable fallback action.
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

// Fallback action options
const fallbackActionOptions = [
  { id: 'assign-any', label: 'assign to any available agent in the queue' },
  { id: 'keep-retrying', label: 'retry assignment within the configured user groups' },
];

// Example Playbook for User Group Expansion
const examplePlaybook = `Assign the conversations to Senior Support Agents or Technical Specialists.
If no support representative is available or the conversation remains unassigned for 30 seconds, expand to Standard Support Team.
If the conversation is still unassigned after 60 seconds, expand to Escalation Team.
If the conversation remains unassigned after 90 seconds, assign to any available agent in the queue.`;

interface ExpansionRule {
  id: string;
  waitTimeValue: string;
  waitTimeUnit: 'seconds' | 'minutes';
  userGroupIds: string[];
}

export interface VariableCondition {
  variableId: string;
  variableLabel: string;
  value: string;
}

interface UserGroupExpansionBranch {
  id: string;
  initialUserGroups: string[];
  expansionRules: ExpansionRule[];
  variableConditions: VariableCondition[];
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
export interface UserGroupExpansionBranchState {
  id: string;
  initialUserGroups: string[];
  expansionRules: ExpansionRule[];
  variableConditions?: VariableCondition[];
}

export interface UserGroupExpansionEditorState {
  branches: UserGroupExpansionBranchState[];
  fallbackAction: 'assign-any' | 'keep-retrying';
  fallbackTimeValue?: number;
  fallbackTimeUnit?: 'seconds' | 'minutes';
  scenarioId?: string;
}

// Context variable type passed from parent
interface ContextVariable {
  id: string;
  label: string;
  description: string;
}

interface UserGroupExpansionEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  initialState?: UserGroupExpansionEditorState;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
  onStateChange?: (state: UserGroupExpansionEditorState, prompt: string) => void;
  contextVariables?: ContextVariable[];
  triggerValidation?: boolean;
  onValidationResult?: (hasErrors: boolean, errors: { message: string }[]) => void;
}

// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'choose',
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
    if (isAllSelected) return 'All';
    return selected.join(' or ');
  };

  return (
    <div className="multi-select-dropdown">
      <button
        type="button"
        className={`multi-select-trigger ${isAllSelected ? 'all-selected' : ''} ${hasError ? 'has-error' : ''}`}
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
            <div className="multi-select-hint">
              Select values to include:
            </div>
            <label className="multi-select-option all-option">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleAll}
              />
              <span>All</span>
            </label>
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

const UserGroupExpansionEditor: React.FC<UserGroupExpansionEditorProps> = ({
  scenarioId,
  initialRequirement,
  initialState,
  onPromptGenerated: _onPromptGenerated,
  onStateChange,
  contextVariables = [],
  triggerValidation = false,
  onValidationResult
}) => {
  // Create default branch helper function with sensible defaults
  const createDefaultBranch = (index: number, vars: ContextVariable[] = []): UserGroupExpansionBranch => ({
    id: `branch-${index}`,
    initialUserGroups: ['ug1'],
    expansionRules: [
      { id: `expansion-${index}-0`, waitTimeValue: '30', waitTimeUnit: 'seconds', userGroupIds: ['ug3'] }
    ],
    variableConditions: vars.map(v => ({
      variableId: v.id,
      variableLabel: v.label,
      value: ''
    }))
  });

  // Helper to migrate old waitTimeSeconds to new format
  const migrateExpansionRule = (rule: any): ExpansionRule => {
    if (rule.waitTimeValue !== undefined) {
      return rule;
    }
    // Migrate from old waitTimeSeconds format
    const seconds = rule.waitTimeSeconds || 30;
    if (seconds >= 60 && seconds % 60 === 0) {
      return { ...rule, waitTimeValue: String(seconds / 60), waitTimeUnit: 'minutes' };
    }
    return { ...rule, waitTimeValue: String(seconds), waitTimeUnit: 'seconds' };
  };

  // Branch configuration - initialize from initialState or with default branch
  const [branches, setBranches] = useState<UserGroupExpansionBranch[]>(() => {
    if (initialState?.branches && initialState.branches.length > 0) {
      return initialState.branches.map(b => ({
        id: b.id,
        initialUserGroups: b.initialUserGroups || [],
        expansionRules: (b.expansionRules || [{ id: `expansion-${b.id}-0`, waitTimeValue: '30', waitTimeUnit: 'seconds', userGroupIds: [] }]).map(migrateExpansionRule),
        variableConditions: b.variableConditions || []
      }));
    }
    return [createDefaultBranch(0, contextVariables)];
  });

  // Fallback action state
  const [fallbackAction, setFallbackAction] = useState<'assign-any' | 'keep-retrying'>(() => {
    return initialState?.fallbackAction || 'assign-any';
  });

  // Fallback time state
  const [fallbackTimeValue, setFallbackTimeValue] = useState<string>(() => {
    return initialState?.fallbackTimeValue?.toString() || '60';
  });
  const [fallbackTimeUnit, setFallbackTimeUnit] = useState<'seconds' | 'minutes'>(() => {
    return initialState?.fallbackTimeUnit || 'seconds';
  });

  // Section collapse states
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; fieldId: string; message: string }[]>([]);

  // Handle validation trigger from parent
  React.useEffect(() => {
    if (triggerValidation && onValidationResult) {
      // Perform validation
      const errors: { branchId: string; fieldId: string; message: string }[] = [];

      branches.forEach((branch, branchIdx) => {
        // Check initial user groups
        if (branch.initialUserGroups.length === 0) {
          errors.push({
            branchId: branch.id,
            fieldId: 'initialUserGroups',
            message: `Branch ${branchIdx + 1}: Please select at least one initial user group`
          });
        }

        // Check expansion rules
        branch.expansionRules.forEach((rule, ruleIdx) => {
          if (rule.userGroupIds.length === 0) {
            errors.push({
              branchId: branch.id,
              fieldId: rule.id,
              message: `Branch ${branchIdx + 1}, Expansion ${ruleIdx + 1}: Please select at least one user group`
            });
          }
        });
      });

      setValidationErrors(errors);
      onValidationResult(errors.length > 0, errors.map(e => ({ message: e.message })));
    }
  }, [triggerValidation]);

  // Update branches when context variables change
  React.useEffect(() => {
    if (contextVariables.length > 0) {
      setBranches(prev => prev.map(branch => {
        // Update variableConditions to match current context variables
        const updatedConditions = contextVariables.map(v => {
          const existing = branch.variableConditions?.find(vc => vc.variableId === v.id);
          return existing || {
            variableId: v.id,
            variableLabel: v.label,
            value: ''
          };
        });
        return { ...branch, variableConditions: updatedConditions };
      }));
    } else {
      // Clear variable conditions when no variables selected
      setBranches(prev => prev.map(branch => ({
        ...branch,
        variableConditions: []
      })));
    }
  }, [contextVariables]);

  const handleVariableConditionChange = (branchId: string, variableId: string, value: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        const updatedConditions = branch.variableConditions.map(vc =>
          vc.variableId === variableId ? { ...vc, value } : vc
        );
        return { ...branch, variableConditions: updatedConditions };
      }
      return branch;
    }));
  };

  const addBranch = () => {
    if (branches.length < 5) {
      const newBranch = createDefaultBranch(Date.now(), contextVariables);
      setBranches(prev => [...prev, newBranch]);
    }
  };

  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
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

  const handleExpansionWaitTimeValueChange = (branchId: string, ruleId: string, value: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          expansionRules: branch.expansionRules.map(rule =>
            rule.id === ruleId ? { ...rule, waitTimeValue: value } : rule
          )
        };
      }
      return branch;
    }));
  };

  const handleExpansionWaitTimeUnitChange = (branchId: string, ruleId: string, unit: 'seconds' | 'minutes') => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          expansionRules: branch.expansionRules.map(rule =>
            rule.id === ruleId ? { ...rule, waitTimeUnit: unit } : rule
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
          waitTimeValue: '60',
          waitTimeUnit: 'seconds',
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

  const getUserGroupName = (id: string) => {
    const group = userGroups.find(g => g.id === id);
    return group?.name || '';
  };

  const generateFinalPrompt = (): string => {
    const lines: string[] = [];
    const hasVariables = contextVariables.length > 0;

    // Add variable declarations if any context variables are selected
    if (hasVariables) {
      let varLine = 'Get ';
      varLine += contextVariables.map((v, idx) => {
        const prefix = idx > 0 ? ' and ' : '';
        const desc = v.description || v.label.toLowerCase();
        return `${prefix}the ${desc} from "ContextVariable.${v.id}"`;
      }).join('');
      varLine += '.';
      lines.push(varLine);
    }

    branches.forEach((branch) => {
      const initialGroups = branch.initialUserGroups.map(id => getUserGroupName(id));
      const initialGroupsText = initialGroups.length > 0 ? initialGroups.join(' or ') : '[choose user group]';

      // Build condition text if variables are present
      let branchLine = '';
      if (hasVariables && branch.variableConditions && branch.variableConditions.length > 0) {
        const conditionParts = branch.variableConditions.map(vc => {
          const valueText = vc.value || '<value>';
          return `${vc.variableLabel.toLowerCase()} is ${valueText}`;
        });
        const conditionText = conditionParts.join(' and ');
        branchLine = `For customer where ${conditionText}, assign the conversations to ${initialGroupsText}.`;
      } else {
        branchLine = `Assign the conversations to ${initialGroupsText}.`;
      }
      lines.push(branchLine);

      branch.expansionRules.forEach((rule, ruleIdx) => {
        const groupNames = rule.userGroupIds.map(id => getUserGroupName(id)).filter(Boolean);
        const groupNamesText = groupNames.length > 0 ? groupNames.join(' or ') : '[choose user group(s)]';
        const waitText = `${rule.waitTimeValue || '30'} ${rule.waitTimeUnit || 'seconds'}`;

        if (ruleIdx === 0) {
          lines.push(`    If no support representative is available or the conversation remains unassigned for ${waitText}, expand to ${groupNamesText}.`);
        } else {
          lines.push(`    If the conversation is still unassigned after ${waitText}, expand to ${groupNamesText}.`);
        }
      });
    });

    // Add fallback action based on selection with time
    const fallbackActionLabel = fallbackActionOptions.find(opt => opt.id === fallbackAction)?.label || 'assign to any member of the queue';
    const timeValue = fallbackTimeValue || '60';
    const timeUnit = fallbackTimeUnit || 'seconds';
    lines.push(`If the conversation remains unassigned after ${timeValue} ${timeUnit}, ${fallbackActionLabel}.`);

    return lines.join('\n');
  };

  // Notify parent of state changes for persistence
  React.useEffect(() => {
    if (onStateChange) {
      const currentState: UserGroupExpansionEditorState = {
        branches: branches.map(b => ({
          id: b.id,
          initialUserGroups: b.initialUserGroups,
          expansionRules: b.expansionRules,
          variableConditions: b.variableConditions
        })),
        fallbackAction,
        fallbackTimeValue: parseInt(fallbackTimeValue) || 60,
        fallbackTimeUnit,
        scenarioId
      };
      const prompt = generateFinalPrompt();
      onStateChange(currentState, prompt);
    }
  }, [branches, fallbackAction, fallbackTimeValue, fallbackTimeUnit, scenarioId, contextVariables]);

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
          <span className="tips-title">Tips for this scenario</span>
        </div>
        {isTipsSectionOpen && (
          <div className="tips-accordion-content">
            <ul className="tips-list">
              <li>This policy will apply to the queues you select.</li>
              <li>Conversations are first assigned to the initial user group(s).</li>
              <li>If unassigned, the system progressively expands to additional groups based on wait time.</li>
              <li>Choose the fallback action to determine what happens if no agents are found.</li>
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
          Click on the <span className="highlight-text">blue dropdowns</span> below to start editing. Configure user groups and wait times for progressive assignment expansion. Then Save or Publish your playbook.
        </div>

        <div className="template-output">
          {/* Variable Declaration */}
          {contextVariables.length > 0 && (
            <div className="template-line">
              Get{' '}
              {contextVariables.map((v, idx) => (
                <React.Fragment key={v.id}>
                  {idx > 0 && ' and '}
                  the {v.description || v.label.toLowerCase()} from{' '}
                  <span className="template-variable">
                    ContextVariable.{v.id}
                  </span>
                </React.Fragment>
              ))}.
            </div>
          )}

          {/* Condition Branches */}
          {branches.map((branch, branchIdx) => {
            const hasVariableConditions = contextVariables.length > 0 && branch.variableConditions && branch.variableConditions.length > 0;
            return (
              <React.Fragment key={branch.id}>
                {/* Main condition line with variable conditions */}
                <div className="template-line condition-line">
                  {hasVariableConditions ? (
                    <>
                      For customer where{' '}
                      {branch.variableConditions.map((vc, vcIdx) => (
                        <React.Fragment key={vc.variableId}>
                          {vcIdx > 0 && ' and '}
                          {vc.variableLabel.toLowerCase()} is{' '}
                          <input
                            type="text"
                            className="template-input small"
                            value={vc.value}
                            onChange={(e) => handleVariableConditionChange(branch.id, vc.variableId, e.target.value)}
                            placeholder="<value>"
                          />
                        </React.Fragment>
                      ))}
                      , assign the conversations to{' '}
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
                  {hasVariableConditions && branches.length < 5 && branchIdx === branches.length - 1 && (
                    <button
                      className="inline-add-btn"
                      onClick={addBranch}
                      title="Add another condition branch (max 5)"
                    >+</button>
                  )}
                  {hasVariableConditions && branches.length > 1 && (
                    <button
                      className="inline-remove-btn"
                      onClick={() => removeBranch(branch.id)}
                      title="Remove this condition branch"
                    >×</button>
                  )}
                </div>

                {/* Expansion Rules */}
                {branch.expansionRules.map((rule, ruleIdx) => (
                  <div key={rule.id} className="template-line fallback-line indented">
                    {ruleIdx === 0 ? (
                      <>If no support representative is available or the conversation remains unassigned for{' '}</>
                    ) : (
                      <>If the conversation is still unassigned after{' '}</>
                    )}
                    <input
                      type="number"
                      className="template-input small time-input"
                      value={rule.waitTimeValue}
                      onChange={(e) => handleExpansionWaitTimeValueChange(branch.id, rule.id, e.target.value)}
                      min="1"
                      placeholder="30"
                    />
                    <select
                      className="template-dropdown time-unit-dropdown"
                      value={rule.waitTimeUnit}
                      onChange={(e) => handleExpansionWaitTimeUnitChange(branch.id, rule.id, e.target.value as 'seconds' | 'minutes')}
                    >
                      <option value="seconds">seconds</option>
                      <option value="minutes">minutes</option>
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

          {/* Default Fallback with Time and Action */}
          <div className="template-line default-fallback">
            If the conversation remains unassigned after{' '}
            <input
              type="number"
              className="template-input small time-input"
              value={fallbackTimeValue}
              onChange={(e) => setFallbackTimeValue(e.target.value)}
              min="1"
              placeholder="60"
            />
            <select
              className="template-dropdown time-unit-dropdown"
              value={fallbackTimeUnit}
              onChange={(e) => setFallbackTimeUnit(e.target.value as 'seconds' | 'minutes')}
            >
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
            </select>,{' '}
            <select
              className="template-dropdown fallback-action-dropdown"
              value={fallbackAction}
              onChange={(e) => setFallbackAction(e.target.value as 'assign-any' | 'keep-retrying')}
            >
              {fallbackActionOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>.
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

        {/* Playbook Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Playbook preview</h4>
          <pre className="generated-policy-text">{generateFinalPrompt()}</pre>
        </div>
      </div>
    </div>
  );
};

export default UserGroupExpansionEditor;
