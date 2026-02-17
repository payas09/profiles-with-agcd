import React, { useState, useRef, useEffect } from 'react';
import './TemplatePromptEditor.css';

// Available variables for Line 1
const contextVariables = [
  { id: 'ContextVariable.IsVIP', label: 'ContextVariable.IsVIP' },
  { id: 'ContextVariable.CustomerTier', label: 'ContextVariable.CustomerTier' },
  { id: 'ContextVariable.AccountAge', label: 'ContextVariable.AccountAge' },
  { id: 'ContextVariable.Region', label: 'ContextVariable.Region' },
  { id: 'ContextVariable.Segment', label: 'ContextVariable.Segment' },
];

const liveWorkItemVariables = [
  { id: 'LiveWorkItem.Intent', label: 'LiveWorkItem.Intent' },
  { id: 'LiveWorkItem.Channel', label: 'LiveWorkItem.Channel' },
  { id: 'LiveWorkItem.Priority', label: 'LiveWorkItem.Priority' },
  { id: 'LiveWorkItem.Sentiment', label: 'LiveWorkItem.Sentiment' },
];

const userAttributeVariables = [
  { id: 'CSAT', label: 'CSAT', description: 'Customer Satisfaction Score' },
  { id: 'Skills', label: 'Skills', description: 'Agent skill proficiencies' },
  { id: 'SkillLevel', label: 'Skill Level', description: 'Agent expertise level' },
  { id: 'AvgHandleTime', label: 'Avg Handle Time', description: 'Average call duration' },
  { id: 'ResolutionRate', label: 'Resolution Rate', description: 'First contact resolution %' },
  { id: 'Tenure', label: 'Tenure', description: 'Time with company' },
  { id: 'Language', label: 'Language', description: 'Languages spoken' },
  { id: 'Capacity', label: 'Capacity', description: 'Current workload capacity' },
];

// Values for each user attribute
const userAttributeValues: { [key: string]: { id: string; label: string }[] } = {
  'CSAT': [
    { id: 'CSAT >= 9', label: 'CSAT >= 9 (Excellent)' },
    { id: 'CSAT >= 8', label: 'CSAT >= 8 (Very Good)' },
    { id: 'CSAT >= 7', label: 'CSAT >= 7 (Good)' },
    { id: 'CSAT >= 6', label: 'CSAT >= 6 (Above Average)' },
    { id: 'CSAT >= 5', label: 'CSAT >= 5 (Average)' },
  ],
  'Skills': [
    { id: 'Billing Expert', label: 'Billing Expert' },
    { id: 'Technical Support', label: 'Technical Support' },
    { id: 'Fraud Investigation', label: 'Fraud Investigation' },
    { id: 'Account Management', label: 'Account Management' },
    { id: 'Sales', label: 'Sales' },
    { id: 'Retention', label: 'Retention' },
    { id: 'Escalation Handler', label: 'Escalation Handler' },
  ],
  'SkillLevel': [
    { id: 'Expert', label: 'Expert' },
    { id: 'Advanced', label: 'Advanced' },
    { id: 'Intermediate', label: 'Intermediate' },
    { id: 'Beginner', label: 'Beginner' },
  ],
  'AvgHandleTime': [
    { id: 'AHT < 3 min', label: 'Less than 3 minutes' },
    { id: 'AHT < 5 min', label: 'Less than 5 minutes' },
    { id: 'AHT < 10 min', label: 'Less than 10 minutes' },
    { id: 'AHT < 15 min', label: 'Less than 15 minutes' },
  ],
  'ResolutionRate': [
    { id: 'FCR >= 95%', label: 'FCR >= 95%' },
    { id: 'FCR >= 90%', label: 'FCR >= 90%' },
    { id: 'FCR >= 85%', label: 'FCR >= 85%' },
    { id: 'FCR >= 80%', label: 'FCR >= 80%' },
  ],
  'Tenure': [
    { id: 'Tenure > 5 years', label: 'More than 5 years' },
    { id: 'Tenure > 3 years', label: 'More than 3 years' },
    { id: 'Tenure > 1 year', label: 'More than 1 year' },
    { id: 'Tenure > 6 months', label: 'More than 6 months' },
  ],
  'Language': [
    { id: 'English', label: 'English' },
    { id: 'Spanish', label: 'Spanish' },
    { id: 'French', label: 'French' },
    { id: 'German', label: 'German' },
    { id: 'Mandarin', label: 'Mandarin' },
    { id: 'Japanese', label: 'Japanese' },
    { id: 'Portuguese', label: 'Portuguese' },
    { id: 'Hindi', label: 'Hindi' },
  ],
  'Capacity': [
    { id: 'Capacity > 80%', label: 'More than 80% available' },
    { id: 'Capacity > 50%', label: 'More than 50% available' },
    { id: 'Capacity > 20%', label: 'More than 20% available' },
    { id: 'Any Capacity', label: 'Any available capacity' },
  ],
};

// Values for each variable (for Line 2 dropdown)
const variableValues: { [key: string]: { id: string; label: string }[] } = {
  'ContextVariable.IsVIP': [
    { id: 'VIP', label: 'VIP' },
    { id: 'Not VIP', label: 'Not VIP' },
    { id: 'All VIP', label: 'All VIP' },
    { id: 'All other VIP', label: 'All other VIP' },
  ],
  'ContextVariable.CustomerTier': [
    { id: 'Diamond', label: 'Diamond' },
    { id: 'Gold', label: 'Gold' },
    { id: 'Silver', label: 'Silver' },
    { id: 'Bronze', label: 'Bronze' },
    { id: 'Standard', label: 'Standard' },
  ],
  'ContextVariable.Region': [
    { id: 'North America', label: 'North America' },
    { id: 'Europe', label: 'Europe' },
    { id: 'Asia Pacific', label: 'Asia Pacific' },
    { id: 'Latin America', label: 'Latin America' },
  ],
  'ContextVariable.Segment': [
    { id: 'Enterprise', label: 'Enterprise' },
    { id: 'SMB', label: 'SMB' },
    { id: 'Consumer', label: 'Consumer' },
  ],
  'LiveWorkItem.Intent': [
    { id: 'Fraud Assist', label: 'Fraud Assist' },
    { id: 'Billing Inquiry', label: 'Billing Inquiry' },
    { id: 'Technical Support', label: 'Technical Support' },
    { id: 'Account Management', label: 'Account Management' },
    { id: 'General Inquiry', label: 'General Inquiry' },
    { id: 'Password Reset', label: 'Password Reset' },
    { id: 'Order Status', label: 'Order Status' },
    { id: 'Cancellation Request', label: 'Cancellation Request' },
  ],
  'LiveWorkItem.Channel': [
    { id: 'Chat', label: 'Chat' },
    { id: 'Voice', label: 'Voice' },
    { id: 'Email', label: 'Email' },
    { id: 'Social', label: 'Social' },
  ],
  'LiveWorkItem.Priority': [
    { id: 'Urgent', label: 'Urgent' },
    { id: 'High', label: 'High' },
    { id: 'Normal', label: 'Normal' },
    { id: 'Low', label: 'Low' },
  ],
  'LiveWorkItem.Sentiment': [
    { id: 'Positive', label: 'Positive' },
    { id: 'Neutral', label: 'Neutral' },
    { id: 'Negative', label: 'Negative' },
    { id: 'Frustrated', label: 'Frustrated' },
  ],
};

const actionOptions = [
  'preferred expert',
  'previous expert',
];

interface RuleBlock {
  id: string;
  conditionValue: string;
  selectedAction: string;
}

interface TemplatePromptEditorProps {
  onPromptChange?: (prompt: string) => void;
}

const TemplatePromptEditor: React.FC<TemplatePromptEditorProps> = ({ onPromptChange }) => {
  // State for editable fields
  const [line1Value, setLine1Value] = useState('');

  // Rule blocks (repeatable condition + action pairs)
  const [ruleBlocks, setRuleBlocks] = useState<RuleBlock[]>([
    { id: 'rule-1', conditionValue: '', selectedAction: '' }
  ]);

  const [lookbackDays, setLookbackDays] = useState('');
  const [additionalConditions, setAdditionalConditions] = useState('');

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Slash menu state
  const [slashMenuVisible, setSlashMenuVisible] = useState(false);
  const [slashMenuTarget, setSlashMenuTarget] = useState<string | null>(null);
  const [slashMenuFilter, setSlashMenuFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Tab state for Line 2 dropdown
  const [activeValueTab, setActiveValueTab] = useState<string>('');

  // State for user attribute cascading dropdown
  const [selectedUserAttribute, setSelectedUserAttribute] = useState<string | null>(null);

  // Track which rule block's dropdown is being edited
  const [activeRuleDropdown, setActiveRuleDropdown] = useState<string | null>(null);

  // Refs for input fields
  const line1Ref = useRef<HTMLInputElement>(null);
  const ruleInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const additionalRef = useRef<HTMLInputElement>(null);

  // Rule block management functions
  const addRuleBlock = () => {
    const newId = `rule-${Date.now()}`;
    setRuleBlocks([...ruleBlocks, { id: newId, conditionValue: '', selectedAction: '' }]);
  };

  const removeRuleBlock = (id: string) => {
    if (ruleBlocks.length > 1) {
      setRuleBlocks(ruleBlocks.filter(block => block.id !== id));
    }
  };

  const updateRuleCondition = (id: string, value: string) => {
    setRuleBlocks(ruleBlocks.map(block =>
      block.id === id ? { ...block, conditionValue: value } : block
    ));
  };

  const updateRuleAction = (id: string, action: string) => {
    setRuleBlocks(ruleBlocks.map(block =>
      block.id === id ? { ...block, selectedAction: action } : block
    ));
    setActiveRuleDropdown(null);
  };

  // Extract selected variables from Line 1
  const getSelectedVariablesFromLine1 = (): string[] => {
    const variables: string[] = [];
    const regex = /\/(ContextVariable\.\w+|LiveWorkItem\.\w+)/g;
    let match;
    while ((match = regex.exec(line1Value)) !== null) {
      variables.push(match[1]);
    }
    return variables;
  };

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const selectAction = (value: string) => {
    setSelectedAction(value);
    setActiveDropdown(null);
  };

  // Handle input change and detect "/"
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: (val: string) => void,
    fieldId: string
  ) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setValue(value);
    setCursorPosition(cursorPos);

    // Check if user just typed "/"
    const lastChar = value[cursorPos - 1];
    if (lastChar === '/') {
      setSlashMenuTarget(fieldId);
      setSlashMenuFilter('');
      setSlashMenuVisible(true);
      setSelectedUserAttribute(null); // Reset user attribute selection

      // For rule blocks, set default active tab to first selected variable
      if (fieldId.startsWith('rule-')) {
        const selectedVars = getSelectedVariablesFromLine1();
        if (selectedVars.length > 0) {
          setActiveValueTab(selectedVars[0]);
        }
      }
    } else if (slashMenuVisible && slashMenuTarget === fieldId) {
      // If slash menu is open, update filter based on text after last "/"
      const slashIndex = value.lastIndexOf('/');
      if (slashIndex !== -1 && cursorPos > slashIndex) {
        const filter = value.substring(slashIndex + 1, cursorPos);
        // If filter contains space, close the menu
        if (filter.includes(' ')) {
          setSlashMenuVisible(false);
          setSlashMenuTarget(null);
        } else {
          setSlashMenuFilter(filter);
        }
      } else {
        setSlashMenuVisible(false);
        setSlashMenuTarget(null);
      }
    }
  };

  // Handle key down for slash menu navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldId: string) => {
    if (slashMenuVisible && slashMenuTarget === fieldId) {
      if (e.key === 'Escape') {
        setSlashMenuVisible(false);
        setSlashMenuTarget(null);
      }
    }
  };

  // Insert selected variable into input
  const insertVariable = (variableId: string) => {
    const getRef = (): { ref: React.RefObject<HTMLInputElement> | HTMLInputElement | null, value: string, setValue: (val: string) => void } | null => {
      if (slashMenuTarget === 'line1') {
        return { ref: line1Ref, value: line1Value, setValue: setLine1Value };
      }
      if (slashMenuTarget === 'additional') {
        return { ref: additionalRef, value: additionalConditions, setValue: setAdditionalConditions };
      }
      // Check if it's a rule block
      if (slashMenuTarget?.startsWith('rule-')) {
        const ruleBlock = ruleBlocks.find(b => b.id === slashMenuTarget);
        if (ruleBlock) {
          return {
            ref: ruleInputRefs.current[slashMenuTarget],
            value: ruleBlock.conditionValue,
            setValue: (val: string) => updateRuleCondition(slashMenuTarget, val)
          };
        }
      }
      return null;
    };

    const target = getRef();
    if (!target) return;

    const { ref, value, setValue } = target;

    // Find the last "/" and replace from there
    const slashIndex = value.lastIndexOf('/');
    if (slashIndex !== -1) {
      // For Line 1, keep the slash; for rule blocks, insert just the value
      const insertText = slashMenuTarget === 'line1' ? '/' + variableId : variableId;
      const newValue = value.substring(0, slashIndex) + insertText + ' ' + value.substring(cursorPosition);
      setValue(newValue);
    }

    setSlashMenuVisible(false);
    setSlashMenuTarget(null);

    // Focus back on input
    setTimeout(() => {
      const inputRef = ref && 'current' in ref ? ref.current : ref;
      inputRef?.focus();
    }, 0);
  };

  // Get filtered variables for Line 1 (variable selection)
  const getFilteredVariablesForLine1 = () => {
    const allVariables = [
      { category: 'Context Variables', items: contextVariables },
      { category: 'Live Work Item Variables', items: liveWorkItemVariables },
    ];

    if (!slashMenuFilter) return allVariables;

    const filter = slashMenuFilter.toLowerCase();
    return allVariables.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(filter) ||
        item.id.toLowerCase().includes(filter)
      )
    })).filter(group => group.items.length > 0);
  };

  // Get values for Line 2 based on selected variables from Line 1
  const getValuesForLine2 = () => {
    const selectedVars = getSelectedVariablesFromLine1();
    const result: { variableId: string; variableName: string; values: { id: string; label: string }[] }[] = [];

    selectedVars.forEach(varId => {
      const values = variableValues[varId];
      if (values) {
        // Get display name (e.g., "IsVIP" from "ContextVariable.IsVIP")
        const displayName = varId.split('.')[1] || varId;

        // Filter values if there's a filter
        let filteredValues = values;
        if (slashMenuFilter) {
          const filter = slashMenuFilter.toLowerCase();
          filteredValues = values.filter(v => v.label.toLowerCase().includes(filter));
        }

        result.push({
          variableId: varId,
          variableName: displayName,
          values: filteredValues
        });
      }
    });

    return result;
  };

  // Get filtered user attributes for additional conditions
  const getFilteredUserAttributes = () => {
    if (!slashMenuFilter) return userAttributeVariables;

    const filter = slashMenuFilter.toLowerCase();
    return userAttributeVariables.filter(item =>
      item.label.toLowerCase().includes(filter) ||
      item.id.toLowerCase().includes(filter)
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tpe-dropdown-wrapper') && !target.closest('.tpe-slash-menu')) {
        setActiveDropdown(null);
        setSlashMenuVisible(false);
        setSlashMenuTarget(null);
        setSelectedUserAttribute(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Render the slash menu for Line 1 (variable selection)
  const renderSlashMenuLine1 = () => (
    <div className="tpe-slash-menu" onClick={(e) => e.stopPropagation()}>
      <div className="tpe-slash-menu-header">Select Variable</div>
      <div className="tpe-slash-menu-scroll">
        {getFilteredVariablesForLine1().map(group => (
          <div key={group.category} className="tpe-slash-menu-group">
            <div className="tpe-slash-menu-category">{group.category}</div>
            {group.items.map(item => (
              <div
                key={item.id}
                className="tpe-slash-menu-item"
                onClick={() => insertVariable(item.id)}
              >
                <span className="tpe-slash-menu-slash">/</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
        {getFilteredVariablesForLine1().length === 0 && (
          <div className="tpe-slash-menu-empty">No variables found</div>
        )}
      </div>
    </div>
  );

  // Render the slash menu for Line 2 (value selection with tabs)
  const renderSlashMenuLine2 = () => {
    const valuesData = getValuesForLine2();

    if (valuesData.length === 0) {
      return (
        <div className="tpe-slash-menu" onClick={(e) => e.stopPropagation()}>
          <div className="tpe-slash-menu-header">Select Value</div>
          <div className="tpe-slash-menu-empty">
            No variables selected in Line 1.<br />
            First select variables using /context or /live work item variables.
          </div>
        </div>
      );
    }

    // Set default active tab if not set
    if (!activeValueTab || !valuesData.find(v => v.variableId === activeValueTab)) {
      if (valuesData.length > 0) {
        setActiveValueTab(valuesData[0].variableId);
      }
    }

    const activeData = valuesData.find(v => v.variableId === activeValueTab);

    return (
      <div className="tpe-slash-menu tpe-slash-menu-tabbed" onClick={(e) => e.stopPropagation()}>
        <div className="tpe-slash-menu-header">Select Value</div>

        {/* Tabs */}
        <div className="tpe-slash-menu-tabs">
          {valuesData.map(data => (
            <button
              key={data.variableId}
              className={`tpe-slash-menu-tab ${activeValueTab === data.variableId ? 'active' : ''}`}
              onClick={() => setActiveValueTab(data.variableId)}
            >
              {data.variableName}
            </button>
          ))}
        </div>

        {/* Values for active tab */}
        <div className="tpe-slash-menu-scroll">
          {activeData && activeData.values.length > 0 ? (
            activeData.values.map(value => (
              <div
                key={value.id}
                className="tpe-slash-menu-item"
                onClick={() => insertVariable(value.id)}
              >
                {value.label}
              </div>
            ))
          ) : (
            <div className="tpe-slash-menu-empty">No matching values</div>
          )}
        </div>
      </div>
    );
  };

  // Handle user attribute selection (shows values dropdown)
  const selectUserAttribute = (attributeId: string) => {
    setSelectedUserAttribute(attributeId);
  };

  // Handle user attribute value selection (inserts into input)
  const selectUserAttributeValue = (value: string) => {
    const target = { ref: additionalRef, value: additionalConditions, setValue: setAdditionalConditions };
    const { value: currentValue, setValue } = target;

    // Find the last "/" and replace from there
    const slashIndex = currentValue.lastIndexOf('/');
    if (slashIndex !== -1) {
      const newValue = currentValue.substring(0, slashIndex) + value + ' ' + currentValue.substring(cursorPosition);
      setValue(newValue);
    }

    setSlashMenuVisible(false);
    setSlashMenuTarget(null);
    setSelectedUserAttribute(null);

    // Focus back on input
    setTimeout(() => {
      additionalRef.current?.focus();
    }, 0);
  };

  // Go back to attribute selection
  const goBackToAttributes = () => {
    setSelectedUserAttribute(null);
  };

  // Render the slash menu for additional conditions (user attributes)
  const renderSlashMenuAdditional = () => {
    // If a user attribute is selected, show its values
    if (selectedUserAttribute) {
      const values = userAttributeValues[selectedUserAttribute] || [];
      const attributeLabel = userAttributeVariables.find(a => a.id === selectedUserAttribute)?.label || selectedUserAttribute;

      return (
        <div className="tpe-slash-menu" onClick={(e) => e.stopPropagation()}>
          <div className="tpe-slash-menu-header-with-back">
            <button className="tpe-slash-menu-back" onClick={goBackToAttributes}>
              ← Back
            </button>
            <span>Select {attributeLabel} Value</span>
          </div>
          <div className="tpe-slash-menu-scroll">
            {values.map(item => (
              <div
                key={item.id}
                className="tpe-slash-menu-item"
                onClick={() => selectUserAttributeValue(item.id)}
              >
                {item.label}
              </div>
            ))}
            {values.length === 0 && (
              <div className="tpe-slash-menu-empty">No values available</div>
            )}
          </div>
        </div>
      );
    }

    // Show attribute selection
    return (
      <div className="tpe-slash-menu" onClick={(e) => e.stopPropagation()}>
        <div className="tpe-slash-menu-header">Select User Attribute</div>
        <div className="tpe-slash-menu-scroll">
          <div className="tpe-slash-menu-group">
            <div className="tpe-slash-menu-category">User Attributes</div>
            {getFilteredUserAttributes().map(item => (
              <div
                key={item.id}
                className="tpe-slash-menu-item tpe-slash-menu-item-with-desc"
                onClick={() => selectUserAttribute(item.id)}
              >
                <div className="tpe-slash-menu-item-main">
                  <span className="tpe-slash-menu-slash">/</span>
                  {item.label}
                  <span className="tpe-slash-menu-arrow">→</span>
                </div>
                {item.description && (
                  <div className="tpe-slash-menu-item-desc">{item.description}</div>
                )}
              </div>
            ))}
          </div>
          {getFilteredUserAttributes().length === 0 && (
            <div className="tpe-slash-menu-empty">No attributes found</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="tpe-container">
      {/* Header */}
      <div className="tpe-header">
        <h3 className="tpe-title">Configure Assignment Policy</h3>
        <p className="tpe-subtitle">
          Fill in the <span className="tpe-blue-text">blue highlighted areas</span> to customize your policy. Type <span className="tpe-variable-hint">/</span> to select from available options.
        </p>
      </div>

      {/* Template Lines */}
      <div className="tpe-template">
        {/* Line 1: Full text box - Variable Selection */}
        <div className="tpe-line tpe-line-with-dropdown">
          <input
            ref={line1Ref}
            type="text"
            className="tpe-textbox tpe-textbox-full"
            placeholder="Select /context variable and /live work item variables and add description about these variables"
            value={line1Value}
            onChange={(e) => handleInputChange(e, setLine1Value, 'line1')}
            onKeyDown={(e) => handleKeyDown(e, 'line1')}
          />
          {slashMenuVisible && slashMenuTarget === 'line1' && renderSlashMenuLine1()}
        </div>

        {/* Condition Blocks (repeatable condition + action pairs) */}
        {ruleBlocks.map((block, index) => (
          <div key={block.id} className="tpe-condition-block">
            {/* Delete button for additional conditions */}
            {ruleBlocks.length > 1 && (
              <button
                className="tpe-condition-delete"
                onClick={() => removeRuleBlock(block.id)}
                title="Remove this condition"
              >
                ✕
              </button>
            )}

            {/* Condition Line */}
            <div className="tpe-line tpe-line-with-dropdown">
              <input
                ref={(el) => { ruleInputRefs.current[block.id] = el; }}
                type="text"
                className="tpe-textbox tpe-textbox-full"
                placeholder="Add assignment condition using one or more /context variable and /live work item variables."
                value={block.conditionValue}
                onChange={(e) => handleInputChange(e, (val) => updateRuleCondition(block.id, val), block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
              />
              {slashMenuVisible && slashMenuTarget === block.id && renderSlashMenuLine2()}
            </div>

            {/* Action Line */}
            <div className="tpe-line tpe-line-mixed">
              <span className="tpe-fixed-text">Offer conversation to</span>
              <div className="tpe-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`tpe-action-chip ${block.selectedAction ? 'has-value' : ''}`}
                  onClick={() => setActiveRuleDropdown(activeRuleDropdown === block.id ? null : block.id)}
                >
                  {block.selectedAction ? block.selectedAction : '/Choose action'}
                </button>
                {activeRuleDropdown === block.id && (
                  <div className="tpe-dropdown-menu">
                    {actionOptions.map(option => (
                      <div
                        key={option}
                        className="tpe-dropdown-item"
                        onClick={() => updateRuleAction(block.id, option)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conditional Line - Only show if "preferred expert" is selected for this rule */}
            {block.selectedAction === 'preferred expert' && (
              <div className="tpe-line tpe-line-mixed tpe-line-conditional">
                <span className="tpe-fixed-text">If no preferred agents are available, assign the conversation to previous expert, who has interacted with the customer in the last</span>
                <input
                  type="text"
                  className="tpe-textbox tpe-textbox-inline tpe-textbox-small"
                  placeholder="10 days"
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(e.target.value)}
                />
                <div className="tpe-inline-dropdown-wrapper">
                  <input
                    ref={additionalRef}
                    type="text"
                    className="tpe-textbox tpe-textbox-inline tpe-textbox-wide"
                    placeholder="and add additional /user variables"
                    value={additionalConditions}
                    onChange={(e) => handleInputChange(e, setAdditionalConditions, 'additional')}
                    onKeyDown={(e) => handleKeyDown(e, 'additional')}
                  />
                  {slashMenuVisible && slashMenuTarget === 'additional' && renderSlashMenuAdditional()}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Condition Button */}
        <div className="tpe-add-condition-wrapper">
          <button className="tpe-add-condition-btn" onClick={addRuleBlock}>
            + Add more condition
          </button>
        </div>

        {/* Line 5: Fixed text only */}
        <div className="tpe-line">
          <span className="tpe-fixed-text">In case of previous expert, assign to the next best expert in the queue.</span>
        </div>
      </div>

      {/* Example Reference */}
      <div className="tpe-example">
        <div className="tpe-example-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
            <path d="M6.5 7.5A.5.5 0 0 1 7 7h2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V8H7a.5.5 0 0 1-.5-.5zM8 4.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"/>
          </svg>
          Example Reference
        </div>
        <div className="tpe-example-content">
          <p>Get the customer's VIP status from <strong>ContextVariable.IsVIP</strong> and the <strong>Intent</strong> of the conversation.</p>
          <p>All <strong>VIP</strong> customers, reaching out for <strong>Fraud Assist</strong> related conversations, should be first offered to one of the <strong>preferred experts</strong> mapped to them.</p>
          <p>If no preferred agents are available, assign the conversation to an expert, who has interacted with the customer in the last <strong>10 days</strong> and has a minimum <strong>CSAT</strong> of <strong>7</strong>.</p>
          <p>All other VIP customers, should be offered to a previous expert, who have interacted with the customer in the last <strong>20 days</strong> and have a minimum <strong>CSAT</strong> of <strong>6</strong>.</p>
          <p>If the caller is not a VIP customer, assign to an expert who has interacted with the customer in the last <strong>60 days</strong>.</p>
          <p>In case of no previous expert, assign to the next best expert in the queue.</p>
        </div>
      </div>
    </div>
  );
};

export default TemplatePromptEditor;
