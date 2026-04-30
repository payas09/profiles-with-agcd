/**
 * User Group Expansion Editor - Specialized template editor for user group expansion scenarios
 *
 * This editor allows users to configure progressive assignment to user groups
 * with levels (0-4) and a configurable fallback action.
 */

import React, { useState, useEffect } from 'react';
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
  { id: 'assign-any', label: 'assign to any member of the queue' },
  { id: 'keep-retrying', label: 'keep retrying among the previously defined user groups' },
];

// Example Playbook for User Group Expansion
const examplePlaybook = `Level 0: For all conversations, attempt assignment to Senior Support Agents or Technical Specialists.
Level 1: If the conversation remains unassigned for 30 seconds, expand to Standard Support Team.
Level 2: If the conversation remains unassigned for 60 seconds, expand to Escalation Team.
If the conversation still remains unassigned, assign to any member of the queue.`;

interface ExpansionLevel {
  id: string;
  level: number;
  waitTimeValue: string;
  waitTimeUnit: 'seconds' | 'minutes';
  userGroupIds: string[];
}

export interface VariableCondition {
  variableId: string;
  variableLabel: string;
  value: string;
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
export interface ExpansionLevelState {
  id: string;
  level: number;
  waitTimeValue: string;
  waitTimeUnit: 'seconds' | 'minutes';
  userGroupIds: string[];
}

export interface UserGroupExpansionEditorState {
  initialUserGroups: string[]; // Level 0
  expansionLevels: ExpansionLevelState[]; // Levels 1-4
  fallbackAction: 'assign-any' | 'keep-retrying';
  scenarioId?: string;
  // Legacy fields for backward compatibility
  branches?: any[];
  fallbackTimeValue?: number;
  fallbackTimeUnit?: 'seconds' | 'minutes';
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

// Multi-Select Dropdown Component for User Groups
interface UserGroupMultiSelectProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

const UserGroupMultiSelect: React.FC<UserGroupMultiSelectProps> = ({
  selectedIds,
  onChange,
  placeholder = 'choose user group(s)',
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (groupId: string) => {
    if (selectedIds.includes(groupId)) {
      onChange(selectedIds.filter(id => id !== groupId));
    } else {
      onChange([...selectedIds, groupId]);
    }
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    const names = selectedIds.map(id => userGroups.find(g => g.id === id)?.name).filter(Boolean);
    return names.join(' or ');
  };

  return (
    <div className="multi-select-dropdown">
      <button
        type="button"
        className={`multi-select-trigger ${hasError ? 'has-error' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedIds.length > 0 ? 'has-selection' : 'placeholder'}>
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
              Select one or more user groups:
            </div>
            {userGroups.map(group => (
              <label key={group.id} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(group.id)}
                  onChange={() => toggleOption(group.id)}
                />
                <span>{group.name}</span>
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
  // Helper to migrate old state format to new format
  const migrateFromOldState = (state: any): { initialUserGroups: string[], expansionLevels: ExpansionLevel[] } => {
    if (state?.branches && state.branches.length > 0) {
      const branch = state.branches[0];
      const initialUserGroups = branch.initialUserGroups || [];
      const expansionLevels: ExpansionLevel[] = (branch.expansionRules || []).map((rule: any, idx: number) => ({
        id: rule.id || `level-${idx + 1}`,
        level: idx + 1,
        waitTimeValue: rule.waitTimeValue || '30',
        waitTimeUnit: rule.waitTimeUnit || 'seconds',
        userGroupIds: rule.userGroupIds || []
      }));
      return { initialUserGroups, expansionLevels };
    }
    return { initialUserGroups: [], expansionLevels: [] };
  };

  // Level 0: Initial user groups
  const [initialUserGroups, setInitialUserGroups] = useState<string[]>(() => {
    if (initialState?.initialUserGroups && initialState.initialUserGroups.length > 0) {
      return initialState.initialUserGroups;
    }
    // Try to migrate from old format
    const migrated = migrateFromOldState(initialState);
    if (migrated.initialUserGroups.length > 0) {
      return migrated.initialUserGroups;
    }
    return ['ug1']; // Default
  });

  // Levels 1-4: Expansion levels
  const [expansionLevels, setExpansionLevels] = useState<ExpansionLevel[]>(() => {
    if (initialState?.expansionLevels && initialState.expansionLevels.length > 0) {
      return initialState.expansionLevels.map(l => ({
        id: l.id,
        level: l.level,
        waitTimeValue: l.waitTimeValue,
        waitTimeUnit: l.waitTimeUnit,
        userGroupIds: l.userGroupIds
      }));
    }
    // Try to migrate from old format
    const migrated = migrateFromOldState(initialState);
    if (migrated.expansionLevels.length > 0) {
      return migrated.expansionLevels;
    }
    // Default: one expansion level
    return [{
      id: 'level-1',
      level: 1,
      waitTimeValue: '30',
      waitTimeUnit: 'seconds',
      userGroupIds: ['ug3']
    }];
  });

  // Fallback action state
  const [fallbackAction, setFallbackAction] = useState<'assign-any' | 'keep-retrying'>(() => {
    return initialState?.fallbackAction || 'assign-any';
  });

  // Section collapse states
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ fieldId: string; message: string }[]>([]);

  // Handle validation trigger from parent
  useEffect(() => {
    if (triggerValidation && onValidationResult) {
      const errors: { fieldId: string; message: string }[] = [];

      // Check Level 0
      if (initialUserGroups.length === 0) {
        errors.push({
          fieldId: 'level-0',
          message: 'Level 0: Please select at least one user group'
        });
      }

      // Check expansion levels
      expansionLevels.forEach((level) => {
        if (level.userGroupIds.length === 0) {
          errors.push({
            fieldId: level.id,
            message: `Level ${level.level}: Please select at least one user group`
          });
        }
      });

      setValidationErrors(errors);
      onValidationResult(errors.length > 0, errors.map(e => ({ message: e.message })));
    }
  }, [triggerValidation]);

  // Add expansion level
  const addExpansionLevel = () => {
    if (expansionLevels.length < 4) {
      const newLevel = expansionLevels.length + 1;
      setExpansionLevels(prev => [...prev, {
        id: `level-${newLevel}-${Date.now()}`,
        level: newLevel,
        waitTimeValue: '60',
        waitTimeUnit: 'seconds',
        userGroupIds: []
      }]);
    }
  };

  // Remove expansion level
  const removeExpansionLevel = (levelId: string) => {
    setExpansionLevels(prev => {
      const filtered = prev.filter(l => l.id !== levelId);
      // Re-number the levels
      return filtered.map((l, idx) => ({ ...l, level: idx + 1 }));
    });
  };

  // Update expansion level user groups
  const handleExpansionUserGroupsChange = (levelId: string, userGroupIds: string[]) => {
    setExpansionLevels(prev => prev.map(level =>
      level.id === levelId ? { ...level, userGroupIds } : level
    ));
    if (userGroupIds.length > 0) {
      setValidationErrors(prev => prev.filter(e => e.fieldId !== levelId));
    }
  };

  // Update expansion level wait time
  const handleExpansionWaitTimeChange = (levelId: string, value: string) => {
    setExpansionLevels(prev => prev.map(level =>
      level.id === levelId ? { ...level, waitTimeValue: value } : level
    ));
  };

  // Update expansion level wait time unit
  const handleExpansionWaitTimeUnitChange = (levelId: string, unit: 'seconds' | 'minutes') => {
    setExpansionLevels(prev => prev.map(level =>
      level.id === levelId ? { ...level, waitTimeUnit: unit } : level
    ));
  };

  const getUserGroupName = (id: string) => {
    const group = userGroups.find(g => g.id === id);
    return group?.name || '';
  };

  const generateFinalPrompt = (): string => {
    const lines: string[] = [];

    // Level 0
    const initialGroupNames = initialUserGroups.map(id => getUserGroupName(id)).filter(Boolean);
    const initialGroupsText = initialGroupNames.length > 0 ? initialGroupNames.join(' or ') : '[choose user group(s)]';
    lines.push(`Level 0: For all conversations, attempt assignment to ${initialGroupsText}.`);

    // Levels 1-4
    expansionLevels.forEach((level) => {
      const groupNames = level.userGroupIds.map(id => getUserGroupName(id)).filter(Boolean);
      const groupNamesText = groupNames.length > 0 ? groupNames.join(' or ') : '[choose user group(s)]';
      const waitText = `${level.waitTimeValue || '30'} ${level.waitTimeUnit || 'seconds'}`;
      lines.push(`Level ${level.level}: If the conversation remains unassigned for ${waitText}, expand to ${groupNamesText}.`);
    });

    // Fallback
    const fallbackActionLabel = fallbackActionOptions.find(opt => opt.id === fallbackAction)?.label || 'assign to any member of the queue';
    lines.push(`If the conversation still remains unassigned, ${fallbackActionLabel}.`);

    return lines.join('\n');
  };

  // Notify parent of state changes for persistence
  useEffect(() => {
    if (onStateChange) {
      const currentState: UserGroupExpansionEditorState = {
        initialUserGroups,
        expansionLevels: expansionLevels.map(l => ({
          id: l.id,
          level: l.level,
          waitTimeValue: l.waitTimeValue,
          waitTimeUnit: l.waitTimeUnit,
          userGroupIds: l.userGroupIds
        })),
        fallbackAction,
        scenarioId
      };
      const prompt = generateFinalPrompt();
      onStateChange(currentState, prompt);
    }
  }, [initialUserGroups, expansionLevels, fallbackAction, scenarioId]);

  const hasError = (fieldId: string): boolean => {
    return validationErrors.some(e => e.fieldId === fieldId);
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
              <li>
                This scenario requires <strong>User groups</strong>. If you haven't created any yet,
                <a href="#" className="tips-link" onClick={(e) => { e.preventDefault(); /* TODO: Navigate to user group creation */ }}>create them here</a>.
              </li>
              <li>
                <strong>Level 0</strong> is where assignment begins. The system first tries to assign conversations to these user groups.
              </li>
              <li>
                <strong>Level 1</strong> can start at 0 seconds (immediately with Level 0). <strong>Levels 2, 3, and 4</strong> require at least 30 seconds.
              </li>
              <li>
                <strong>Wait times are total</strong>, measured from when the conversation started. For example, if Level 1 is set to 30 seconds and Level 2 is set to 45 seconds, the gap between them is 15 seconds.
              </li>
              <li>
                <strong>Same wait time?</strong> Levels with identical wait times trigger back-to-back with no delay. Use this to add multiple user groups at the same point.
              </li>
              <li>
                <strong>Earlier levels have priority.</strong> As you expand, previous user groups stay active but new ones are added with lower priority.
              </li>
              <li>
                <strong>Wait time starts from conversation creation</strong>, not from when it entered the current queue (e.g., after a transfer).
              </li>
              <li>
                <strong>Fallback action</strong> kicks in when no expert is found after all levels have been tried.
              </li>
              <li>
                Only user groups <strong>common to all selected queues/profiles</strong> are shown here.
              </li>
            </ul>
            <div className="tips-example">
              <strong>Example:</strong>
              <pre className="tips-example-text">{examplePlaybook}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Template Section */}
      <div className="template-output-section-main">
        <div className="template-instruction">
          Click on the <span className="highlight-text">blue dropdowns</span> below to configure user groups for each level. You can add up to 4 expansion levels. Then Save or Publish your playbook.
        </div>

        <div className="template-output">
          {/* Level 0: Initial Assignment */}
          <div className="template-line level-line">
            <span className="level-label">Level 0:</span>
            {' '}For all conversations, attempt assignment to{' '}
            <UserGroupMultiSelect
              selectedIds={initialUserGroups}
              onChange={(ids) => {
                setInitialUserGroups(ids);
                if (ids.length > 0) {
                  setValidationErrors(prev => prev.filter(e => e.fieldId !== 'level-0'));
                }
              }}
              placeholder="choose user group(s)"
              hasError={hasError('level-0')}
            />.
          </div>

          {/* Expansion Levels 1-4 */}
          {expansionLevels.map((level, idx) => (
            <div key={level.id} className="template-line level-line">
              <span className="level-label">Level {level.level}:</span>
              {' '}If the conversation remains unassigned for{' '}
              <input
                type="number"
                className="template-input small time-input"
                value={level.waitTimeValue}
                onChange={(e) => handleExpansionWaitTimeChange(level.id, e.target.value)}
                min="1"
                placeholder="30"
              />
              <select
                className="template-dropdown time-unit-dropdown"
                value={level.waitTimeUnit}
                onChange={(e) => handleExpansionWaitTimeUnitChange(level.id, e.target.value as 'seconds' | 'minutes')}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
              </select>
              , expand to{' '}
              <UserGroupMultiSelect
                selectedIds={level.userGroupIds}
                onChange={(ids) => handleExpansionUserGroupsChange(level.id, ids)}
                placeholder="choose user group(s)"
                hasError={hasError(level.id)}
              />.
              {/* Add button on last level if less than 4 */}
              {idx === expansionLevels.length - 1 && expansionLevels.length < 4 && (
                <button
                  className="inline-add-btn"
                  onClick={addExpansionLevel}
                  title="Add expansion level (max 4)"
                >+</button>
              )}
              {/* Remove button if more than 0 levels */}
              <button
                className="inline-remove-btn"
                onClick={() => removeExpansionLevel(level.id)}
                title="Remove this level"
              >×</button>
            </div>
          ))}

          {/* Add Level button when no expansion levels exist */}
          {expansionLevels.length === 0 && (
            <div className="add-level-section">
              <button
                className="add-fallback-btn"
                onClick={addExpansionLevel}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Add expansion level
              </button>
            </div>
          )}

          {/* Fallback Divider */}
          <div className="branches-divider">
            <span className="branches-divider-text">Fallback</span>
          </div>

          {/* Fallback Action */}
          <div className="template-line fallback-line">
            If the conversation still remains unassigned,{' '}
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
