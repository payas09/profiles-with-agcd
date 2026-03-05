/**
 * Template-Based Editor for AgCD Policy Creation
 *
 * IMPORTANT: For creating new template editors or modifying existing ones,
 * refer to the Template Editor Guide: src/components/TEMPLATE_EDITOR_GUIDE.md
 *
 * This guide documents:
 * - Required structure and patterns for all template editors
 * - CSS classes to use from TemplateBasedEditor.css
 * - How to add new scenario-specific editors
 * - Shared components (MultiSelectDropdown, etc.)
 */

import React, { useState } from 'react';
import './TemplateBasedEditor.css';
import RingExpansionEditor from './RingExpansionEditor';
import OverflowHandlingEditor from './OverflowHandlingEditor';
import PriorityEscalationEditor from './PriorityEscalationEditor';

// ============================================
// Variables Configuration
// ============================================

const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', values: ['True', 'False'] },
  { id: 'CustomerTier', label: 'Customer Tier', values: ['Gold', 'Silver', 'Bronze', 'Standard', 'Platinum', 'Diamond', 'Enterprise', 'SMB', 'Startup'] },
  { id: 'Language', label: 'Preferred Language', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese'] },
  { id: 'Region', label: 'Customer Region', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'] },
  { id: 'AccountType', label: 'Account Type', values: ['Premium', 'Standard', 'Trial', 'Free', 'Enterprise', 'Government', 'Education'] },
  { id: 'LoyaltyYears', label: 'Years as Customer', values: ['< 1 year', '1-3 years', '3-5 years', '5+ years', '10+ years'] },
  { id: 'SpendTier', label: 'Spend Tier', values: ['High Value', 'Medium Value', 'Low Value', 'New Customer'] },
];

const liveWorkItemVariables = [
  { id: 'Intent', label: 'Conversation Intent', values: ['Fraud Assist', 'Billing Inquiry', 'Technical Support', 'General Inquiry', 'Account Management', 'Sales', 'Complaints', 'Returns'] },
  { id: 'Channel', label: 'Channel', values: ['Voice', 'Chat', 'Email', 'Social', 'SMS', 'WhatsApp', 'Teams', 'Web'] },
  { id: 'Priority', label: 'Priority', values: ['Urgent', 'High', 'Medium', 'Low'] },
  { id: 'Sentiment', label: 'Customer Sentiment', values: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },
  { id: 'ProductCategory', label: 'Product Category', values: ['Software', 'Hardware', 'Services', 'Subscription', 'Support', 'Training'] },
  { id: 'IssueComplexity', label: 'Issue Complexity', values: ['Simple', 'Moderate', 'Complex', 'Escalation Required'] },
];

const actionOptions = [
  { id: 'preferred-expert', label: 'Preferred Expert' },
  { id: 'previous-expert', label: 'Previous Expert' },
];

const lookbackOptions = [7, 10, 14, 20, 30, 60, 90];

const userAttributeOptions = [
  { id: 'Skills', label: 'Skills', values: ['Billing', 'Technical Support', 'Sales', 'Fraud', 'Account Management', 'Escalation', 'VIP Support', 'Returns'] },
  { id: 'Language', label: 'Language', values: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Hindi'] },
  { id: 'Region', label: 'Region', values: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'] },
  { id: 'CSAT', label: 'CSAT Score', values: ['5', '6', '7', '8', '9', '10'] },
  { id: 'ResolutionRate', label: 'Resolution Rate', values: ['70%', '75%', '80%', '85%', '90%', '95%'] },
  { id: 'Availability', label: 'Availability', values: ['Available', 'Busy', 'Away'] },
  { id: 'ExpertiseLevel', label: 'Expertise Level', values: ['Junior', 'Mid', 'Senior', 'Expert', 'Lead'] },
  { id: 'Certification', label: 'Certification', values: ['Basic', 'Advanced', 'Expert', 'Master'] },
];

// Example Playbook
const examplePlaybook = `Get the customer's VIP status from ContextVariable.IsVIP and the Intent of the conversation from LiveWorkItem.Intent.

For Customer where Is VIP Customer is True and Conversation Intent is Fraud Assist, offer to Preferred Expert.
If no preferred agents are available, assign the conversation to an expert who has interacted with the customer in the last 10 days and has minimum CSAT of 7.

For Customer where Is VIP Customer is True and Conversation Intent is Billing Inquiry, offer to Previous Expert who has interacted with the customer in the last 20 days and has minimum CSAT of 6.

For Customer where Is VIP Customer is False, offer to Previous Expert who has interacted with the customer in the last 60 days.

In case of no previous expert, assign to the next best expert in the queue.`;

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

interface ConditionBranch {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  action: string;
  lookbackDays?: number;
  enabledAttributes: { [attrId: string]: string[] };
  attributeExcludeMode: { [attrId: string]: boolean };
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

// Import types from OverflowHandlingEditor for state persistence
import type { TemplateEditorState } from './OverflowHandlingEditor';

// Export state types for this editor
export interface ExpertRoutingBranchState {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  action: string;
  lookbackDays?: number;
  enabledAttributes: { [attrId: string]: string[] };
  attributeExcludeMode: { [attrId: string]: boolean };
}

export interface SelectedVariableState {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

export interface ExpertRoutingEditorState {
  branches: ExpertRoutingBranchState[];
  selectedContextVars: SelectedVariableState[];
  selectedLWIVars: SelectedVariableState[];
  scenarioId?: string;
}

interface TemplateBasedEditorProps {
  scenarioName?: string;
  initialRequirement?: string;
  scenarioId?: string;
  initialState?: TemplateEditorState | ExpertRoutingEditorState;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
  onPolicyConfigChange?: (config: PolicyConfig) => void;
  onStateChange?: (state: TemplateEditorState | ExpertRoutingEditorState, prompt: string) => void;
}

// ============================================
// Main Component
// ============================================

const TemplateBasedEditor: React.FC<TemplateBasedEditorProps> = ({
  initialRequirement,
  scenarioId,
  initialState,
  onPromptGenerated,
  onPolicyConfigChange,
  onStateChange
}) => {
  // Check if this is a ring expansion scenario
  const isRingExpansionScenario = scenarioId === 'ring-expansion-restricted' || scenarioId === 'ring-expansion-open';

  // Check if this is an overflow handling scenario
  const isOverflowScenario = scenarioId === 'overflow-conditions-actions' ||
    scenarioId === 'overflow-conversation-accepted' ||
    scenarioId === 'overflow-conversation-rejected' ||
    scenarioId === 'overflow-missed-notification';

  // Check if this is a priority escalation scenario
  const isPriorityEscalationScenario = scenarioId === 'wait-time-escalation' ||
    scenarioId === 'queue-transfer-escalation';

  // If ring expansion scenario, render the specialized editor
  if (isRingExpansionScenario) {
    return (
      <RingExpansionEditor
        scenarioId={scenarioId}
        initialRequirement={initialRequirement}
        initialState={initialState as any}
        onPromptGenerated={onPromptGenerated}
        onStateChange={onStateChange as any}
      />
    );
  }

  // If overflow scenario, render the overflow handling editor
  if (isOverflowScenario) {
    return (
      <OverflowHandlingEditor
        scenarioId={scenarioId}
        initialRequirement={initialRequirement}
        initialState={initialState as TemplateEditorState}
        onPromptGenerated={onPromptGenerated}
        onStateChange={onStateChange as any}
      />
    );
  }

  // If priority escalation scenario, render the priority escalation editor
  if (isPriorityEscalationScenario) {
    return (
      <PriorityEscalationEditor
        scenarioId={scenarioId}
        initialRequirement={initialRequirement}
        initialState={initialState as any}
        onPromptGenerated={onPromptGenerated}
        onStateChange={onStateChange as any}
      />
    );
  }

  // Create default branch helper function
  const createDefaultBranch = (index: number): ConditionBranch => ({
    id: `branch-${index}`,
    variableValues: {},
    variableExcludeMode: {},
    disabledVariables: [],
    action: 'preferred-expert',
    lookbackDays: 14,
    enabledAttributes: {},
    attributeExcludeMode: {}
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

  // Cast initialState to the correct type for this editor
  const expertState = initialState as ExpertRoutingEditorState | undefined;

  // Selected variables - initialize from initialState if provided
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>(() => {
    if (expertState?.selectedContextVars) {
      return restoreVariablesFromState(expertState.selectedContextVars, contextVariables);
    }
    return [];
  });
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>(() => {
    if (expertState?.selectedLWIVars) {
      return restoreVariablesFromState(expertState.selectedLWIVars, liveWorkItemVariables);
    }
    return [];
  });

  // Branch configuration - initialize from initialState or with 2 default branches
  const [branches, setBranches] = useState<ConditionBranch[]>(() => {
    if (expertState?.branches && expertState.branches.length > 0) {
      return expertState.branches.map(b => ({
        id: b.id,
        variableValues: b.variableValues || {},
        variableExcludeMode: b.variableExcludeMode || {},
        disabledVariables: b.disabledVariables || [],
        action: b.action || 'preferred-expert',
        lookbackDays: b.lookbackDays || 14,
        enabledAttributes: b.enabledAttributes || {},
        attributeExcludeMode: b.attributeExcludeMode || {}
      }));
    }
    return [createDefaultBranch(0)];
  });

  // Section collapse states
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(() => {
    return (expertState?.selectedContextVars?.length || 0) > 0 || (expertState?.selectedLWIVars?.length || 0) > 0;
  });
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ branchId: string; variableId: string; message: string }[]>([]);

  // Get all selected variables
  const allSelectedVariables: SelectedVariable[] = [...selectedContextVars, ...selectedLWIVars];

  // Add a context variable
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

  // Remove a context variable
  const removeContextVariable = (varId: string) => {
    setSelectedContextVars(prev => prev.filter(v => v.id !== varId));
  };

  // Add a LWI variable
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

  // Remove a LWI variable
  const removeLWIVariable = (varId: string) => {
    setSelectedLWIVars(prev => prev.filter(v => v.id !== varId));
  };

  // Add a new branch
  const addBranch = () => {
    const newBranch: ConditionBranch = {
      id: `branch-${Date.now()}`,
      variableValues: {},
      variableExcludeMode: {},
      disabledVariables: [],
      action: 'preferred-expert',
      lookbackDays: 14,
      enabledAttributes: {},
      attributeExcludeMode: {}
    };
    setBranches(prev => [...prev, newBranch]);
  };

  // Remove a branch
  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
  };

  // Toggle variable enabled/disabled for a branch
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

  // Handle branch value change (multi-select)
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

  // Handle variable exclude mode toggle
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

  // Handle branch action change
  const handleBranchActionChange = (branchId: string, action: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return { ...branch, action };
      }
      return branch;
    }));
  };

  // Handle branch lookback change
  const handleBranchLookbackChange = (branchId: string, days: number) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return { ...branch, lookbackDays: days };
      }
      return branch;
    }));
  };

  // Toggle attribute enabled/disabled for a branch
  const toggleAttributeForBranch = (branchId: string, attrId: string) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        const isEnabled = branch.enabledAttributes && attrId in branch.enabledAttributes;
        if (isEnabled) {
          const { [attrId]: _, ...rest } = branch.enabledAttributes || {};
          return { ...branch, enabledAttributes: rest };
        } else {
          return {
            ...branch,
            enabledAttributes: { ...(branch.enabledAttributes || {}), [attrId]: [] }
          };
        }
      }
      return branch;
    }));
  };

  // Handle attribute values change (multi-select)
  const handleAttributeValuesChange = (branchId: string, attrId: string, values: string[]) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          enabledAttributes: { ...(branch.enabledAttributes || {}), [attrId]: values }
        };
      }
      return branch;
    }));
  };

  // Handle attribute exclude mode toggle
  const handleAttributeExcludeModeChange = (branchId: string, attrId: string, exclude: boolean) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          attributeExcludeMode: { ...(branch.attributeExcludeMode || {}), [attrId]: exclude }
        };
      }
      return branch;
    }));
  };

  // Generate final prompt from template
  const generateFinalPrompt = (): string => {
    const lines: string[] = [];

    // Variable declaration line
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

    // Condition branches
    branches.forEach((branch) => {
      const activeVariables = allSelectedVariables.filter(
        v => !(branch.disabledVariables || []).includes(v.id)
      );

      const conditionParts = activeVariables.map(v => {
        const values = branch.variableValues[v.id] || [];
        const isExclude = branch.variableExcludeMode?.[v.id] || false;
        const isAllSelected = values.length === v.values.length && v.values.every(val => values.includes(val));
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

      // Build attribute text from enabled attributes
      const enabledAttrs = branch.enabledAttributes || {};
      const attrParts = Object.entries(enabledAttrs).map(([attrId, values]) => {
        const attr = userAttributeOptions.find(a => a.id === attrId);
        const isExclude = branch.attributeExcludeMode?.[attrId] || false;
        if (values.length === 0) {
          return `has ${attr?.label || attrId} of [choose value]`;
        }
        if (isExclude) {
          return `has ${attr?.label || attrId} of All except ${values.join(', ')}`;
        }
        return `has ${attr?.label || attrId} of ${values.join(' or ')}`;
      });
      const attrText = attrParts.length > 0 ? ` and ${attrParts.join(' and ')}` : '';

      if (branch.action === 'preferred-expert') {
        if (conditionText) {
          lines.push(`For customers where ${conditionText}, offer to Preferred Expert.`);
        } else {
          lines.push(`For all customers, offer to Preferred Expert.`);
        }
        const lookback = branch.lookbackDays || 14;
        lines.push(`If no preferred agents are available, assign to an expert who has interacted with the customer in the last ${lookback} days${attrText}.`);
      } else {
        const lookback = branch.lookbackDays || 14;
        if (conditionText) {
          lines.push(`For customers where ${conditionText}, offer to Previous Expert.`);
        } else {
          lines.push(`For all customers, offer to Previous Expert.`);
        }
        lines.push(`Route to expert who has interacted with the customer in the last ${lookback} days${attrText}.`);
      }
    });

    lines.push("In case of no previous expert, assign to the next best expert in the queue.");

    return lines.join('\n\n');
  };

  // Notify parent of state changes for persistence
  React.useEffect(() => {
    if (onStateChange) {
      const currentState: ExpertRoutingEditorState = {
        branches: branches.map(b => ({
          id: b.id,
          variableValues: b.variableValues,
          variableExcludeMode: b.variableExcludeMode,
          disabledVariables: b.disabledVariables,
          action: b.action,
          lookbackDays: b.lookbackDays,
          enabledAttributes: b.enabledAttributes,
          attributeExcludeMode: b.attributeExcludeMode
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
      onStateChange(currentState as any, prompt);
    }
  }, [branches, selectedContextVars, selectedLWIVars, scenarioId]);

  // Check if a specific variable in a branch has an error
  const hasError = (branchId: string, variableId: string): boolean => {
    return validationErrors.some(e => e.branchId === branchId && e.variableId === variableId);
  };

  // Get available context variables (not already selected)
  const availableContextVars = contextVariables.filter(
    v => !selectedContextVars.find(sv => sv.id === v.id)
  );

  // Get available LWI variables (not already selected)
  const availableLWIVars = liveWorkItemVariables.filter(
    v => !selectedLWIVars.find(sv => sv.id === v.id)
  );

  return (
    <div className="template-editor-container">
      {/* Header with requirement */}
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
              <li>Add variables below if you want to define different routing behavior for specific customers or conversations.</li>
              <li>This policy will only apply to queues associated with the profiles you select.</li>
              <li>Preferred Expert routes to an agent marked as preferred for the customer.</li>
              <li>Previous Expert routes to an agent who has previously interacted with the customer within the lookback period.</li>
              <li>You can add user attributes to filter agents by skills, CSAT score, language, etc.</li>
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
                              onChange={(values) => {
                                handleBranchValueChange(branch.id, v.id, values);
                                if (values.length > 0) {
                                  setValidationErrors(prev => prev.filter(e => !(e.branchId === branch.id && e.variableId === v.id)));
                                }
                              }}
                              placeholder="choose"
                              excludeMode={branch.variableExcludeMode?.[v.id] || false}
                              onExcludeModeChange={(exclude) => handleVariableExcludeModeChange(branch.id, v.id, exclude)}
                              hasError={hasError(branch.id, v.id)}
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
                      , offer to{' '}
                    </>
                  ) : (
                    <>For all customers, offer to{' '}</>
                  )}
                  <select
                    className="template-dropdown"
                    value={branch.action}
                    onChange={(e) => handleBranchActionChange(branch.id, e.target.value)}
                  >
                    {actionOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>.
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

                {/* Fallback line */}
                <div className="template-line fallback-line">
                  {branch.action === 'preferred-expert' ? (
                    <>If no preferred agents are available, assign to an expert who has interacted with the customer in the last{' '}</>
                  ) : (
                    <>Route to expert who has interacted with the customer in the last{' '}</>
                  )}
                  <select
                    className="template-dropdown small"
                    value={branch.lookbackDays || 14}
                    onChange={(e) => handleBranchLookbackChange(branch.id, parseInt(e.target.value))}
                  >
                    {lookbackOptions.map(days => (
                      <option key={days} value={days}>{days}</option>
                    ))}
                  </select>
                  {' '}days
                  {/* Enabled attributes with toggle and multi-select values */}
                  {userAttributeOptions.map(attr => {
                    const isEnabled = branch.enabledAttributes && attr.id in branch.enabledAttributes;
                    if (isEnabled) {
                      return (
                        <span key={attr.id} className="attribute-condition">
                          {' '}and has{' '}
                          <button
                            className="attribute-toggle-btn"
                            onClick={() => toggleAttributeForBranch(branch.id, attr.id)}
                            title="Click to remove this attribute"
                          >×</button>
                          {attr.label}:{' '}
                          <MultiSelectDropdown
                            options={attr.values}
                            selected={branch.enabledAttributes[attr.id] || []}
                            onChange={(values) => handleAttributeValuesChange(branch.id, attr.id, values)}
                            placeholder="choose"
                            excludeMode={branch.attributeExcludeMode?.[attr.id] || false}
                            onExcludeModeChange={(exclude) => handleAttributeExcludeModeChange(branch.id, attr.id, exclude)}
                          />
                        </span>
                      );
                    }
                    return null;
                  })}
                  {/* User Attributes dropdown for adding more */}
                  {userAttributeOptions.some(attr => !(branch.enabledAttributes && attr.id in branch.enabledAttributes)) && (
                    <select
                      className="user-attributes-dropdown"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          toggleAttributeForBranch(branch.id, e.target.value);
                        }
                      }}
                    >
                      <option value="">+ User Attributes</option>
                      {userAttributeOptions
                        .filter(attr => !(branch.enabledAttributes && attr.id in branch.enabledAttributes))
                        .map(attr => (
                          <option key={attr.id} value={attr.id}>{attr.label}</option>
                        ))}
                    </select>
                  )}.
                </div>
              </React.Fragment>
            );
          })}

          {/* Default Fallback */}
          <div className="template-line default-fallback">
            In case of no previous expert, assign to the next best expert in the queue.
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

        {/* Generated Policy Preview */}
        <div className="generated-policy-section">
          <h4 className="generated-policy-title">Generated Policy</h4>
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
              Add variables to create conditional routing rules for specific customers or conversations.
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

export default TemplateBasedEditor;
