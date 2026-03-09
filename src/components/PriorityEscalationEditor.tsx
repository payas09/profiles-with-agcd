/**
 * Priority Escalation Editor for AgCD Policy Creation
 * Handles "wait-time-escalation" and "queue-transfer-escalation" scenarios
 */

import React, { useState, useEffect } from 'react';
import './TemplateBasedEditor.css';

// ============================================
// Variables Configuration (same as other editors)
// ============================================

const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', workstream: 'Premium Support - Voice', values: ['True', 'False'] },
  { id: 'CustomerTier', label: 'Customer Tier', workstream: 'General Support - Voice', values: ['Gold', 'Silver', 'Bronze', 'Standard', 'Platinum', 'Diamond', 'Enterprise', 'SMB', 'Startup'] },
  { id: 'Language', label: 'Preferred Language', workstream: 'Chat Support - Messaging', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese'] },
  { id: 'Region', label: 'Customer Region', workstream: 'Regional Support - Voice', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'] },
  { id: 'AccountType', label: 'Account Type', workstream: 'Account Services - Messaging', values: ['Premium', 'Standard', 'Trial', 'Free', 'Enterprise', 'Government', 'Education'] },
  { id: 'LoyaltyYears', label: 'Years as Customer', workstream: 'Loyalty Program - Voice', values: ['< 1 year', '1-3 years', '3-5 years', '5+ years', '10+ years'] },
  { id: 'SpendTier', label: 'Spend Tier', workstream: 'Sales Support - Messaging', values: ['High Value', 'Medium Value', 'Low Value', 'New Customer'] },
];

const liveWorkItemVariables = [
  { id: 'Intent', label: 'Conversation Intent', values: ['Fraud Assist', 'Billing Inquiry', 'Technical Support', 'General Inquiry', 'Account Management', 'Sales', 'Complaints', 'Returns'] },
  { id: 'Channel', label: 'Channel', values: ['Voice', 'Chat', 'Email', 'Social', 'SMS', 'WhatsApp', 'Teams', 'Web'] },
  { id: 'Priority', label: 'Priority', values: ['Urgent', 'High', 'Medium', 'Low'] },
  { id: 'Sentiment', label: 'Customer Sentiment', values: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },
  { id: 'ProductCategory', label: 'Product Category', values: ['Software', 'Hardware', 'Services', 'Subscription', 'Support', 'Training'] },
  { id: 'IssueComplexity', label: 'Issue Complexity', values: ['Simple', 'Moderate', 'Complex', 'Escalation Required'] },
];

// ============================================
// Interfaces
// ============================================

interface SelectedVariable {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface SelectedVariableState {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface PriorityBranchState {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  priorityScore: string;
  timeInterval?: string;
  timeUnit?: 'seconds' | 'minutes';
}

export interface PriorityEscalationEditorState {
  branches: PriorityBranchState[];
  selectedContextVars: SelectedVariableState[];
  selectedLWIVars: SelectedVariableState[];
  defaultScore: string;
  scenarioId?: string;
}

interface PriorityEscalationEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  initialState?: PriorityEscalationEditorState;
  onPromptGenerated?: (prompt: string, config: any) => void;
  onStateChange?: (state: PriorityEscalationEditorState, prompt: string) => void;
  isPublicPreview?: boolean;
  triggerValidation?: boolean;
  onValidationResult?: (hasErrors: boolean, errors: { message: string }[]) => void;
}

// Multi-Select Dropdown Component with Include/Exclude mode
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
  placeholder = 'Select...',
  excludeMode = false,
  onExcludeModeChange,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const formatSelectedValues = (): string => {
    if (selected.length === 0) return placeholder;
    if (excludeMode) {
      return `All except ${selected.join(', ')}`;
    }
    return selected.join(', ');
  };

  return (
    <div className={`multi-select-dropdown ${hasError ? 'has-error' : ''}`}>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="multi-select-value">{formatSelectedValues()}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4l4 4 4-4" />
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
            <div className="multi-select-options">
              {options.map(option => (
                <label key={option} className="multi-select-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Scenario Configuration
// ============================================

const scenarioConfig: { [key: string]: {
  title: string;
  hasTimeInterval: boolean;
  tips: string[];
  example: string;
}} = {
  'wait-time-escalation': {
    title: 'Escalate priority based on wait time',
    hasTimeInterval: true,
    tips: [
      'Set a priority score increase for each time interval to ensure longer-waiting customers get higher priority.',
      'Consider starting with smaller score increments (e.g., 10-20) and shorter intervals (e.g., 30-60 seconds).',
      'The default score applies to all customers not matching specific conditions.',
      'Higher priority scores will cause conversations to be routed before lower-scored ones.',
      'Add variables from the section below to create advanced conditions based on customer or conversation attributes.'
    ],
    example: `For all customers, increase the priority score of the conversation by 10 for every 30 seconds increase in wait time.

For customers where Is VIP Customer is True, increase the priority score of the conversation by 20 for every 30 seconds increase in wait time.

For all other customers, increase priority score by 5.`
  },
  'queue-transfer-escalation': {
    title: 'Escalate priority based on transfer to queue',
    hasTimeInterval: false,
    tips: [
      'Transferred conversations often indicate escalated issues - consider higher priority scores.',
      'The priority score is applied immediately when the conversation is transferred.',
      'The default score applies to all customers not matching specific conditions.',
      'Use this to ensure transferred customers don\'t wait as long as new conversations.',
      'Add variables from the section below to create advanced conditions based on customer or conversation attributes.'
    ],
    example: `For all customers, increase priority score of conversations by 20.

For customers where Is VIP Customer is True, increase priority score of conversations by 50.

For all other customers, increase priority score by 10.`
  }
};

// ============================================
// Component
// ============================================

const PriorityEscalationEditor: React.FC<PriorityEscalationEditorProps> = ({
  scenarioId,
  initialRequirement,
  initialState,
  onStateChange,
  isPublicPreview = false,
  triggerValidation = false,
  onValidationResult
}) => {
  const config = scenarioConfig[scenarioId] || scenarioConfig['wait-time-escalation'];

  // Public preview limitation popups
  const [showVariableLimitPopup, setShowVariableLimitPopup] = useState(false);
  const [showBranchLimitPopup, setShowBranchLimitPopup] = useState(false);

  // Helper to restore variables from state
  const restoreVariablesFromState = (savedVars: SelectedVariableState[] | undefined, sourceVars: typeof contextVariables): SelectedVariable[] => {
    if (!savedVars || savedVars.length === 0) return [];
    return savedVars.map(sv => {
      const sourceVar = sourceVars.find(v => v.id === sv.id);
      return {
        id: sv.id,
        label: sv.label,
        description: sv.description || sv.label,
        type: sv.type,
        values: sourceVar?.values || sv.values || []
      };
    });
  };

  // Create default branch
  const createDefaultBranch = (index: number): PriorityBranchState => ({
    id: `branch-${index}`,
    variableValues: {},
    variableExcludeMode: {},
    disabledVariables: [],
    priorityScore: '10',
    timeInterval: '30',
    timeUnit: 'seconds'
  });

  // State
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(true);
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(false);

  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>(
    initialState?.selectedContextVars
      ? restoreVariablesFromState(initialState.selectedContextVars, contextVariables)
      : []
  );
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>(
    initialState?.selectedLWIVars
      ? restoreVariablesFromState(initialState.selectedLWIVars, liveWorkItemVariables)
      : []
  );

  const [branches, setBranches] = useState<PriorityBranchState[]>(
    initialState?.branches && initialState.branches.length > 0
      ? initialState.branches
      : [createDefaultBranch(1)]
  );

  const [defaultScore, setDefaultScore] = useState(initialState?.defaultScore || '5');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; fieldId: string; message: string }[]>([]);

  const allSelectedVariables = [...selectedContextVars, ...selectedLWIVars];
  const availableContextVars = contextVariables.filter(v => !selectedContextVars.find(sv => sv.id === v.id));
  const availableLWIVars = liveWorkItemVariables.filter(v => !selectedLWIVars.find(sv => sv.id === v.id));

  // Variable management
  const addContextVariable = (varId: string) => {
    // Public preview: limit to 2 customer variables
    if (isPublicPreview && selectedContextVars.length >= 2) {
      setShowVariableLimitPopup(true);
      return;
    }

    const variable = contextVariables.find(v => v.id === varId);
    if (variable) {
      setSelectedContextVars(prev => [...prev, {
        id: variable.id,
        label: variable.label,
        description: '',
        type: 'context' as const,
        values: variable.values
      }]);
    }
  };

  const addLWIVariable = (varId: string) => {
    const variable = liveWorkItemVariables.find(v => v.id === varId);
    if (variable) {
      setSelectedLWIVars(prev => [...prev, {
        id: variable.id,
        label: variable.label,
        description: '',
        type: 'lwi' as const,
        values: variable.values
      }]);
    }
  };

  const removeContextVariable = (varId: string) => {
    setSelectedContextVars(prev => prev.filter(v => v.id !== varId));
  };

  const removeLWIVariable = (varId: string) => {
    setSelectedLWIVars(prev => prev.filter(v => v.id !== varId));
  };

  const updateContextVarDescription = (varId: string, description: string) => {
    setSelectedContextVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
  };

  const updateLWIVarDescription = (varId: string, description: string) => {
    setSelectedLWIVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
  };

  // Branch management
  const addBranch = () => {
    // Public preview: limit to 12 branches
    if (isPublicPreview && branches.length >= 12) {
      setShowBranchLimitPopup(true);
      return;
    }
    setBranches(prev => [...prev, createDefaultBranch(prev.length + 1)]);
  };

  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
  };

  const handleBranchValueChange = (branchId: string, variableId: string, values: string[]) => {
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, variableValues: { ...b.variableValues, [variableId]: values } } : b
    ));
  };

  const handleVariableExcludeModeChange = (branchId: string, variableId: string, exclude: boolean) => {
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, variableExcludeMode: { ...b.variableExcludeMode, [variableId]: exclude } } : b
    ));
  };

  const toggleVariableForBranch = (branchId: string, variableId: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      const disabled = b.disabledVariables || [];
      if (disabled.includes(variableId)) {
        return { ...b, disabledVariables: disabled.filter(id => id !== variableId) };
      } else {
        return { ...b, disabledVariables: [...disabled, variableId] };
      }
    }));
  };

  const handlePriorityScoreChange = (branchId: string, score: string) => {
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, priorityScore: score } : b
    ));
  };

  const handleTimeIntervalChange = (branchId: string, interval: string) => {
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, timeInterval: interval } : b
    ));
  };

  const handleTimeUnitChange = (branchId: string, unit: 'seconds' | 'minutes') => {
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, timeUnit: unit } : b
    ));
  };

  // ============================================
  // Validation Helper Functions
  // ============================================

  // Get a normalized signature for a branch's conditions (for comparison)
  const getConditionSignature = (branch: PriorityBranchState): string => {
    const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));
    if (activeVars.length === 0) return 'ALL_CUSTOMERS';

    const conditions = activeVars
      .map(v => {
        const values = branch.variableValues[v.id] || [];
        const normalizedValues = values.map(val => val.trim().toLowerCase()).sort().join(',');
        return `${v.id}:${normalizedValues}`;
      })
      .filter(c => !c.endsWith(':')) // Filter out empty conditions
      .sort();

    return conditions.length > 0 ? conditions.join('|') : 'ALL_CUSTOMERS';
  };

  // Get a signature for the action (priority score and time interval)
  const getActionSignature = (branch: PriorityBranchState): string => {
    if (config.hasTimeInterval) {
      return `priority:${branch.priorityScore}|interval:${branch.timeInterval}|unit:${branch.timeUnit}`;
    }
    return `priority:${branch.priorityScore}`;
  };

  // Check if one condition is a subset of another (more specific)
  const isConditionSubset = (subsetBranch: PriorityBranchState, supersetBranch: PriorityBranchState): boolean => {
    const subsetVars = allSelectedVariables.filter(v => !(subsetBranch.disabledVariables || []).includes(v.id));
    const supersetVars = allSelectedVariables.filter(v => !(supersetBranch.disabledVariables || []).includes(v.id));

    // If superset is "all customers", subset is always a subset
    if (supersetVars.length === 0) return subsetVars.length > 0;

    // Subset must have all conditions of superset (and possibly more)
    for (const superVar of supersetVars) {
      const subVar = subsetVars.find(v => v.id === superVar.id);
      if (!subVar) return false; // Subset must include all superset variables

      const superValues = (supersetBranch.variableValues[superVar.id] || []).map(v => v.trim().toLowerCase());
      const subValues = (subsetBranch.variableValues[subVar.id] || []).map(v => v.trim().toLowerCase());

      // Subset values must match or be more specific
      if (superValues.length > 0 && !superValues.some(sv => subValues.includes(sv))) {
        return false;
      }
    }

    // Subset should have more conditions or same conditions to be considered a subset
    return subsetVars.length >= supersetVars.length;
  };

  // Check if two conditions have any overlap (could apply to same customer)
  const doConditionsOverlap = (branch1: PriorityBranchState, branch2: PriorityBranchState): boolean => {
    const vars1 = allSelectedVariables.filter(v => !(branch1.disabledVariables || []).includes(v.id));
    const vars2 = allSelectedVariables.filter(v => !(branch2.disabledVariables || []).includes(v.id));

    // If either is "all customers", they overlap
    if (vars1.length === 0 || vars2.length === 0) return true;

    // Check each common variable for value overlap
    for (const v1 of vars1) {
      const v2 = vars2.find(v => v.id === v1.id);
      if (v2) {
        const values1 = (branch1.variableValues[v1.id] || []).map(v => v.trim().toLowerCase());
        const values2 = (branch2.variableValues[v2.id] || []).map(v => v.trim().toLowerCase());

        // If both have values and no overlap, conditions don't overlap
        if (values1.length > 0 && values2.length > 0) {
          const hasOverlap = values1.some(v => values2.includes(v));
          if (!hasOverlap) return false;
        }
      }
    }

    return true;
  };

  // Get human-readable description of a branch's conditions
  const describeBranchConditions = (branch: PriorityBranchState, branchIndex: number): string => {
    const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));

    if (activeVars.length === 0) return `Condition ${branchIndex + 1}: "For all customers"`;

    const conditions = activeVars.map(v => {
      const values = branch.variableValues[v.id] || [];
      const valueText = values.length > 0 ? values.join(', ') : '[no value]';
      return `${v.label} = ${valueText}`;
    }).join(' AND ');

    return `Condition ${branchIndex + 1}: "${conditions}"`;
  };

  // Validate branches for blank fields, out-of-range values, duplicates and conflicts
  const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
    const errors: { branchId: string; fieldId: string; message: string }[] = [];

    // First pass: Check for blank fields and out-of-range values
    branches.forEach((branch, branchIndex) => {
      const conditionLabel = `Condition ${branchIndex + 1}`;

      // Check priority score is not blank
      if (!branch.priorityScore || branch.priorityScore.trim() === '') {
        errors.push({
          branchId: branch.id,
          fieldId: 'blank-priority',
          message: `${conditionLabel}: Priority score is required.`
        });
      } else {
        // Check priority score is within valid range (0-10,000)
        const score = parseFloat(branch.priorityScore);
        if (isNaN(score) || score < 0 || score > 10000) {
          errors.push({
            branchId: branch.id,
            fieldId: 'invalid-priority',
            message: `${conditionLabel}: Priority score must be between 0 and 10,000. Current value: ${branch.priorityScore}`
          });
        }
      }

      // Check time interval is not blank (for wait-time-escalation scenario)
      if (config.hasTimeInterval) {
        if (!branch.timeInterval || branch.timeInterval.trim() === '') {
          errors.push({
            branchId: branch.id,
            fieldId: 'blank-interval',
            message: `${conditionLabel}: Time interval is required.`
          });
        } else {
          const interval = parseFloat(branch.timeInterval);
          if (isNaN(interval) || interval <= 0) {
            errors.push({
              branchId: branch.id,
              fieldId: 'invalid-interval',
              message: `${conditionLabel}: Time interval must be a positive number.`
            });
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

    // Check default score is not blank and within range
    if (!defaultScore || defaultScore.trim() === '') {
      errors.push({
        branchId: 'default',
        fieldId: 'blank-default-score',
        message: 'Default priority score is required.'
      });
    } else {
      const score = parseFloat(defaultScore);
      if (isNaN(score) || score < 0 || score > 10000) {
        errors.push({
          branchId: 'default',
          fieldId: 'invalid-default-score',
          message: `Default priority score must be between 0 and 10,000. Current value: ${defaultScore}`
        });
      }
    }

    // Second pass: Check for duplicates and conflicts
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const branch1 = branches[i];
        const branch2 = branches[j];

        const sig1 = getConditionSignature(branch1);
        const sig2 = getConditionSignature(branch2);
        const action1 = getActionSignature(branch1);
        const action2 = getActionSignature(branch2);

        const desc1 = describeBranchConditions(branch1, i);
        const desc2 = describeBranchConditions(branch2, j);

        // Case 1: Exact duplicate (same conditions, same action)
        if (sig1 === sig2 && action1 === action2) {
          errors.push({
            branchId: branch2.id,
            fieldId: 'duplicate',
            message: `Duplicate condition detected: ${desc2} is identical to ${desc1}. Both have the same conditions and priority score.`
          });
          continue;
        }

        // Case 2: Conflict (same conditions, different action)
        if (sig1 === sig2 && action1 !== action2) {
          errors.push({
            branchId: branch2.id,
            fieldId: 'conflict',
            message: `Conflicting conditions detected: ${desc1} and ${desc2} have the same conditions but different priority scores (${branch1.priorityScore} vs ${branch2.priorityScore}).`
          });
          continue;
        }

        // Case 3: Subset with same action (redundant)
        if (isConditionSubset(branch2, branch1) && action1 === action2) {
          errors.push({
            branchId: branch2.id,
            fieldId: 'redundant',
            message: `Redundant condition: ${desc2} is covered by ${desc1} with the same priority score. The more specific condition is unnecessary.`
          });
          continue;
        }

        // Case 4: Overlapping conditions with different actions (potential conflict)
        if (doConditionsOverlap(branch1, branch2) && action1 !== action2) {
          // Only flag if one is a subset of the other with different actions
          if (isConditionSubset(branch2, branch1) || isConditionSubset(branch1, branch2)) {
            errors.push({
              branchId: branch2.id,
              fieldId: 'overlap-conflict',
              message: `Overlapping conditions with different actions: ${desc1} (score: ${branch1.priorityScore}) and ${desc2} (score: ${branch2.priorityScore}) may apply to the same customers.`
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

  // Generate the policy text
  const generatePolicyText = (): string => {
    let prompt = '';

    // Variable declarations
    if (allSelectedVariables.length > 0) {
      prompt += 'Get ';
      prompt += allSelectedVariables.map((v, idx) => {
        const prefix = idx > 0 ? ' and ' : '';
        return `${prefix}the ${v.description || v.label.toLowerCase()} from ${v.type === 'context' ? 'ContextVariable' : 'LiveWorkItem'}.${v.id}`;
      }).join('');
      prompt += '.\n\n';
    }

    // Branches
    branches.forEach((branch) => {
      const activeVars = allSelectedVariables.filter(v => !(branch.disabledVariables || []).includes(v.id));

      if (activeVars.length > 0) {
        prompt += 'For customers where ';
        prompt += activeVars.map((v, idx) => {
          const values = branch.variableValues[v.id] || [];
          const isExclude = branch.variableExcludeMode?.[v.id] || false;
          const valueText = values.length > 0
            ? (isExclude ? `All except ${values.join(', ')}` : values.join(', '))
            : '[choose values]';
          return `${idx > 0 ? ' and ' : ''}${v.description || v.label} is ${valueText}`;
        }).join('');
        prompt += ', ';
      } else {
        prompt += 'For all customers, ';
      }

      if (config.hasTimeInterval) {
        prompt += `increase the priority score of the conversation by ${branch.priorityScore} for every ${branch.timeInterval} ${branch.timeUnit} increase in wait time.\n\n`;
      } else {
        prompt += `increase priority score of conversations by ${branch.priorityScore}.\n\n`;
      }
    });

    // Default fallback
    prompt += `For all other customers, increase priority score by ${defaultScore}.`;

    return prompt;
  };

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      const state: PriorityEscalationEditorState = {
        branches,
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
        defaultScore,
        scenarioId
      };
      onStateChange(state, generatePolicyText());
    }
  }, [branches, selectedContextVars, selectedLWIVars, defaultScore, scenarioId]);

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

      {/* Tips Accordion */}
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
            <ul className="tips-list">
              {config.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
            <div className="tips-example">
              <strong>Example:</strong>
              <pre className="tips-example-text">{config.example}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Template Section */}
      <div className="template-output-section-main">
        <div className="template-instruction">
          Click on the <span className="highlight-text">blue dropdowns</span> below to start editing. Optionally, add variables from the section below to create advanced conditions based on customer or conversation attributes. Then Save or Publish your policy.
        </div>

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

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="validation-errors-section">
              <div className="validation-errors-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Please fix the following issues before saving:</span>
              </div>
              <ul className="validation-errors-list-simple">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Priority Branches */}
          {branches.map((branch, branchIndex) => {
            const activeVariables = allSelectedVariables.filter(
              v => !(branch.disabledVariables || []).includes(v.id)
            );
            const disabledVariables = allSelectedVariables.filter(
              v => (branch.disabledVariables || []).includes(v.id)
            );

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
                    ,{' '}
                  </>
                ) : (
                  <>For all customers,{' '}</>
                )}

                {/* Priority action */}
                increase the priority score of the conversation by{' '}
                <input
                  type="number"
                  className="template-input-inline"
                  value={branch.priorityScore}
                  onChange={(e) => handlePriorityScoreChange(branch.id, e.target.value)}
                  min="1"
                  max="1000"
                />
                {config.hasTimeInterval && (
                  <>
                    {' '}for every{' '}
                    <input
                      type="number"
                      className="template-input-inline"
                      value={branch.timeInterval}
                      onChange={(e) => handleTimeIntervalChange(branch.id, e.target.value)}
                      min="1"
                      max="3600"
                    />
                    {' '}
                    <select
                      className="template-dropdown"
                      value={branch.timeUnit}
                      onChange={(e) => handleTimeUnitChange(branch.id, e.target.value as 'seconds' | 'minutes')}
                    >
                      <option value="seconds">seconds</option>
                      <option value="minutes">minutes</option>
                    </select>
                    {' '}increase in wait time
                  </>
                )}
                .

                {/* Add/Remove buttons */}
                <span className="rule-actions">
                  <button
                    className={`inline-add-btn ${isPublicPreview && branches.length >= 12 ? 'disabled' : ''}`}
                    onClick={addBranch}
                    title={isPublicPreview && branches.length >= 12 ? 'Maximum 12 branches allowed in public preview' : 'Add rule after this'}
                    disabled={isPublicPreview && branches.length >= 12}
                  >+</button>
                  {branches.length > 1 && (
                    <button
                      className="inline-remove-btn"
                      onClick={() => removeBranch(branch.id)}
                      title="Remove this rule"
                    >−</button>
                  )}
                </span>
              </div>
            );
          })}

          {/* Default Fallback */}
          <div className="template-line" style={{ marginTop: '16px' }}>
            <span className="policy-text policy-fallback">
              For all other customers, increase priority score by{' '}
              <input
                type="number"
                className="template-input-inline"
                value={defaultScore}
                onChange={(e) => setDefaultScore(e.target.value)}
                min="0"
                max="1000"
              />
              .
            </span>
          </div>
        </div>

        {/* Generated Playbook Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Generated Playbook</h4>
          <pre className="generated-policy-text">{generatePolicyText()}</pre>
        </div>
      </div>

      {/* Variables Accordion */}
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
              Add variables to create conditional priority rules based on customer or conversation attributes.
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

export default PriorityEscalationEditor;
