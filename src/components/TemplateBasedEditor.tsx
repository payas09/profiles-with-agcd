import React, { useState } from 'react';
import './TemplateBasedEditor.css';

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

For Customer where Is VIP Customer is True AND Conversation Intent is Fraud Assist, offer to Preferred Expert.
If no preferred agents are available, assign the conversation to an expert who has interacted with the customer in the last 10 days and has minimum CSAT of 7.

For Customer where Is VIP Customer is True AND Conversation Intent is Billing Inquiry, offer to Previous Expert who has interacted with the customer in the last 20 days and has minimum CSAT of 6.

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
  variableExcludeMode: { [variableId: string]: boolean }; // true = exclude mode ("All except"), false = include mode
  disabledVariables: string[]; // Variables to skip/grey out for this branch
  action: string;
  lookbackDays?: number;
  enabledAttributes: { [attrId: string]: string[] }; // Enabled attributes with their values (multi-select)
  attributeExcludeMode: { [attrId: string]: boolean }; // true = exclude mode for attributes
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
            {/* Include/Exclude Mode Toggle */}
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
            {/* All Option - only show in Include mode */}
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

interface TemplateBasedEditorProps {
  scenarioName?: string;
  initialRequirement?: string;
  scenarioId?: string;
  onPromptGenerated?: (prompt: string, config: PolicyConfig) => void;
  onPolicyConfigChange?: (config: PolicyConfig) => void;
}

// ============================================
// Main Component
// ============================================

const TemplateBasedEditor: React.FC<TemplateBasedEditorProps> = ({
  initialRequirement,
  onPromptGenerated,
  onPolicyConfigChange
}) => {
  // Selected variables (multiple)
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>([]);
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>([]);

  // Number of branches (just a number input)
  const [numberOfBranches, setNumberOfBranches] = useState<number>(2);

  // Branch configuration (generated when template is created)
  const [branches, setBranches] = useState<ConditionBranch[]>([]);

  // Template generated flag
  const [isTemplateGenerated, setIsTemplateGenerated] = useState(false);

  // Section collapse states
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(true);
  const [isBranchesSectionOpen, setIsBranchesSectionOpen] = useState(true);

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

  // Update context variable description
  const updateContextVarDescription = (varId: string, description: string) => {
    setSelectedContextVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
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

  // Update LWI variable description
  const updateLWIVarDescription = (varId: string, description: string) => {
    setSelectedLWIVars(prev => prev.map(v =>
      v.id === varId ? { ...v, description } : v
    ));
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
          // Remove the attribute
          const { [attrId]: _, ...rest } = branch.enabledAttributes || {};
          return { ...branch, enabledAttributes: rest };
        } else {
          // Enable with empty array (user will select values)
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

  // Check if can generate template
  const canGenerateTemplate = allSelectedVariables.length >= 1 && numberOfBranches >= 1;

  // Generate template - creates branches based on the number input
  const handleGenerateTemplate = () => {
    // Generate branches based on numberOfBranches
    const generatedBranches: ConditionBranch[] = [];
    for (let i = 0; i < numberOfBranches; i++) {
      generatedBranches.push({
        id: `branch-${i}`,
        variableValues: {},
        variableExcludeMode: {},
        disabledVariables: [],
        action: 'preferred-expert',
        lookbackDays: 14,
        enabledAttributes: {},
        attributeExcludeMode: {}
      });
    }
    setBranches(generatedBranches);
    setIsTemplateGenerated(true);
    setIsVariablesSectionOpen(false);
    setIsBranchesSectionOpen(false);
  };

  // Generate final prompt from template
  const generateFinalPrompt = (): string => {
    const lines: string[] = [];

    // Variable declaration line
    const varParts = allSelectedVariables.map(v => {
      const desc = v.description || v.label.toLowerCase();
      if (v.type === 'context') {
        return `the ${desc} from ContextVariable.${v.id}`;
      } else {
        return `the ${desc} from LiveWorkItem.${v.id}`;
      }
    });
    lines.push(`Get ${varParts.join(' and ')}.`);

    // Condition branches
    branches.forEach((branch) => {
      // Filter out disabled variables for this branch
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

      const conditionText = conditionParts.length > 0 ? conditionParts.join(' AND ') : '[no conditions]';

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
        lines.push(`For Customer where ${conditionText}, offer to Preferred Expert.`);
        // Show fallback line for preferred-expert action
        const lookback = branch.lookbackDays || 14;
        lines.push(`If no preferred agents are available, assign to an expert who has interacted with the customer in the last ${lookback} days${attrText}.`);
      } else {
        // Previous expert action
        const lookback = branch.lookbackDays || 14;
        lines.push(`For Customer where ${conditionText}, offer to Previous Expert.`);
        lines.push(`Route to expert who has interacted with the customer in the last ${lookback} days${attrText}.`);
      }
    });

    lines.push("In case of no previous expert, assign to the next best expert in the queue.");

    return lines.join('\n');
  };

  // Validate all branches have values for active variables
  const validateBranches = (): { branchId: string; variableId: string; message: string }[] => {
    const errors: { branchId: string; variableId: string; message: string }[] = [];

    branches.forEach((branch, branchIndex) => {
      // Get active variables (not disabled) for this branch
      const activeVariables = allSelectedVariables.filter(
        v => !(branch.disabledVariables || []).includes(v.id)
      );

      // Check each active variable has values selected
      activeVariables.forEach(v => {
        const values = branch.variableValues[v.id] || [];
        if (values.length === 0) {
          errors.push({
            branchId: branch.id,
            variableId: v.id,
            message: `Branch ${branchIndex + 1}: Please select a value for "${v.description || v.label}"`
          });
        }
      });
    });

    return errors;
  };

  // Handle save/apply
  const handleApplyTemplate = () => {
    // Validate first
    const errors = validateBranches();
    setValidationErrors(errors);

    if (errors.length > 0) {
      // Don't proceed if there are errors
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
        action: b.action as 'preferred-expert' | 'previous-expert' | 'queue-strategy',
        lookbackPeriod: b.lookbackDays,
        userAttributes: Object.entries(b.enabledAttributes || {}).map(([id, values]) => ({ id, value: values.join(', ') }))
      })),
      defaultAction: 'queue-strategy'
    };

    if (onPromptGenerated) {
      onPromptGenerated(prompt, config);
    }
    if (onPolicyConfigChange) {
      onPolicyConfigChange(config);
    }
  };

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

      {/* Example Playbook Reference */}
      <div className="example-playbook-section">
        <div className="example-playbook-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <span>Example Playbook</span>
          <button className="example-toggle-btn" id="example-toggle">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 4l4 4-4 4"/>
            </svg>
          </button>
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
            <h3 className="section-title">Select Variables</h3>
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
              Choose the variables you want to use in your routing policy. You can select multiple variables from each category.
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

                {/* Selected context variables */}
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
                          placeholder={`Describe how this appears in policy (e.g., "customer's VIP status")`}
                          value={v.description}
                          onChange={(e) => updateContextVarDescription(v.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add more dropdown */}
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

                {/* Selected LWI variables */}
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
                          placeholder={`Describe how this appears in policy (e.g., "conversation intent")`}
                          value={v.description}
                          onChange={(e) => updateLWIVarDescription(v.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add more dropdown */}
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
              Enter the number of condition branches you need. Each branch represents a unique routing rule.
            </p>

            <div className="branch-number-input-group">
              <label className="branch-number-label">Number of condition branches:</label>
              <input
                type="number"
                className="branch-number-input"
                value={numberOfBranches}
                onChange={(e) => setNumberOfBranches(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={20}
              />
            </div>

            {/* Example explanation */}
            <div className="branch-example-box">
              <h5 className="example-title">What are condition branches?</h5>
              <p className="example-desc">
                Each branch defines a routing rule for a specific combination of variable values. For example:
              </p>
              <ul className="example-list">
                <li><strong>Branch 1:</strong> VIP = True AND Intent = Fraud Assist → Route to Preferred Expert</li>
                <li><strong>Branch 2:</strong> VIP = True AND Intent = Billing → Route to Previous Expert (14 days)</li>
                <li><strong>Branch 3:</strong> VIP = False → Route to Previous Expert (60 days)</li>
              </ul>
              <p className="example-note">You'll configure the specific values and actions for each branch after generating the template.</p>
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
          {!canGenerateTemplate && (
            <p className="generate-hint">Select at least one variable to generate the template</p>
          )}
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
              Fill in the <span className="highlight-text">blue dropdowns</span> to customize your policy.
            </p>

            <div className="template-output">
              {/* Variable Declaration */}
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
                      For Customer where{' '}
                      {activeVariables.length > 0 ? (
                        activeVariables.map((v, varIdx) => (
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
                                onChange={(values) => {
                                  handleBranchValueChange(branch.id, v.id, values);
                                  // Clear errors when value is selected
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
                        ))
                      ) : (
                        <span className="no-conditions">[no conditions selected]</span>
                      )}
                      {/* Show disabled variables as greyed out chips */}
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

                    {/* Fallback line - shows when action is "preferred-expert" */}
                    {branch.action === 'preferred-expert' && (
                      <div className="template-line fallback-line">
                        If no preferred agents are available, assign to an expert who has interacted with the customer in the last{' '}
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
                    )}

                    {/* Additional line - shows when action is "previous-expert" */}
                    {branch.action === 'previous-expert' && (
                      <div className="template-line fallback-line">
                        Route to expert who has interacted with the customer in the last{' '}
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
                    )}

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

export default TemplateBasedEditor;
