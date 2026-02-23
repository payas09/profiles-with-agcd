# Template-Based Editor Guide

This guide documents the structure and patterns for creating template-based editors in the AgCD prototype. Use this when adding new scenario-specific template editors.

## Architecture Overview

All template-based editors follow a common structure:
1. **Variables Selection (Optional)** - Section 1
2. **Branch Configuration** - Section 2
3. **Generated Policy Template** - Section 3

## Key Files

- `TemplateBasedEditor.tsx` - Main editor component that handles routing logic scenarios
- `TemplateBasedEditor.css` - Shared CSS for all template editors
- `RingExpansionEditor.tsx` - Specialized editor for ring expansion scenarios

## Adding a New Scenario Template Editor

### Step 1: Create the Editor Component

Create a new file (e.g., `YourScenarioEditor.tsx`) following this structure:

```tsx
import React, { useState } from 'react';
import './TemplateBasedEditor.css';  // ALWAYS use shared CSS

// 1. Define your scenario-specific data
const yourScenarioOptions = [
  { id: 'opt1', name: 'Option 1' },
  // ...
];

// 2. Reuse common variable definitions
const contextVariables = [
  { id: 'IsVIP', label: 'Is VIP Customer', values: ['True', 'False'] },
  // ... standard context variables
];

const liveWorkItemVariables = [
  { id: 'Intent', label: 'Conversation Intent', values: [...] },
  // ... standard LWI variables
];

// 3. Define your scenario-specific example playbook
const examplePlaybook = `Your example playbook text here...`;

// 4. Define interfaces
interface SelectedVariable {
  id: string;
  label: string;
  description: string;
  type: 'context' | 'lwi';
  values: string[];
}

interface YourScenarioBranch {
  id: string;
  variableValues: { [variableId: string]: string[] };
  variableExcludeMode: { [variableId: string]: boolean };
  disabledVariables: string[];
  // Add your scenario-specific fields here
}

// 5. Implement the component
const YourScenarioEditor: React.FC<YourScenarioEditorProps> = ({
  scenarioId,
  initialRequirement,
  onPromptGenerated
}) => {
  // State management - follow existing patterns
  const [selectedContextVars, setSelectedContextVars] = useState<SelectedVariable[]>([]);
  const [selectedLWIVars, setSelectedLWIVars] = useState<SelectedVariable[]>([]);
  const [numberOfBranches, setNumberOfBranches] = useState<number>(2);  // Default 2, range 1-5
  const [branches, setBranches] = useState<YourScenarioBranch[]>([]);
  const [isTemplateGenerated, setIsTemplateGenerated] = useState(false);
  const [isVariablesSectionOpen, setIsVariablesSectionOpen] = useState(true);
  const [isBranchesSectionOpen, setIsBranchesSectionOpen] = useState(true);
  const [validationErrors, setValidationErrors] = useState<...>([]);

  // ... implement handlers following existing patterns

  return (
    <div className="template-editor-container">
      {/* Follow the standard structure below */}
    </div>
  );
};

export default YourScenarioEditor;
```

### Step 2: Follow Standard Structure

#### Section 1: Variables (Optional)
```tsx
{/* Section 1: Variable Selection */}
<div className="template-section">
  <div className="section-header" onClick={() => setIsVariablesSectionOpen(!isVariablesSectionOpen)}>
    <div className="section-header-left">
      <span className={`section-chevron ${isVariablesSectionOpen ? 'open' : ''}`}>
        <svg>...</svg>
      </span>
      <span className="section-number">1</span>
      <h3 className="section-title">Select Variables (Optional)</h3>
      {/* Summary when collapsed */}
    </div>
    {/* Check icon when values selected */}
  </div>

  {isVariablesSectionOpen && (
    <div className="section-content">
      <p className="section-desc">
        Optionally select variables... Skip this if you want the same logic for all conversations.
      </p>
      <div className="variables-grid">
        {/* Context Variables category */}
        {/* LWI Variables category */}
      </div>
    </div>
  )}
</div>
```

#### Section 2: Branches
```tsx
{/* Section 2: Branches */}
<div className="template-section">
  <div className="section-header">
    {/* Similar structure */}
    <h3 className="section-title">Configure Condition Branches</h3>
  </div>
  {isBranchesSectionOpen && (
    <div className="section-content">
      <p className="section-desc">...</p>
      <div className="branch-number-input-group">
        <label className="branch-number-label">Number of condition branches:</label>
        <input
          type="number"
          className="branch-number-input"
          value={numberOfBranches}
          onChange={(e) => setNumberOfBranches(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
          min={1}
          max={5}  // Always limit to 1-5
        />
      </div>
    </div>
  )}
</div>
```

#### Section 3: Generated Template
```tsx
{isTemplateGenerated && (
  <div className="template-section template-output-section">
    <div className="section-header non-collapsible">
      <div className="section-header-left">
        <span className="section-number">3</span>
        <h3 className="section-title">Generated Policy Template</h3>
      </div>
      <button className="regenerate-btn">Modify</button>
    </div>

    <div className="section-content template-output-content">
      <p className="template-instruction">
        Fill in the <span className="highlight-text">blue dropdowns</span> to customize your policy.
      </p>

      <div className="template-output">
        {/* Condition lines */}
        <div className="template-line condition-line">
          {/* Your scenario-specific template content */}
          <select className="template-dropdown">...</select>
          <button className="inline-add-btn">+</button>
          <button className="inline-remove-btn">×</button>
        </div>

        {/* Fallback/expansion lines */}
        <div className="template-line fallback-line">
          <select className="template-dropdown small">...</select>
        </div>

        {/* Default fallback */}
        <div className="template-line default-fallback">
          Your default fallback text.
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">...</div>
      )}

      {/* Apply button */}
      <div className="template-actions">
        <button className="apply-template-btn" onClick={handleApplyTemplate}>
          Apply Policy
        </button>
      </div>
    </div>
  </div>
)}
```

### Step 3: Register in TemplateBasedEditor.tsx

Add conditional rendering in `TemplateBasedEditor.tsx`:

```tsx
import YourScenarioEditor from './YourScenarioEditor';

const TemplateBasedEditor: React.FC<...> = ({ ... }) => {
  // Add your scenario check
  const isYourScenario = scenarioId === 'your-scenario-id';

  if (isYourScenario) {
    return (
      <YourScenarioEditor
        scenarioId={scenarioId}
        initialRequirement={initialRequirement}
        onPromptGenerated={onPromptGenerated}
      />
    );
  }

  // ... existing code
};
```

## Required CSS Classes

Always use these classes from `TemplateBasedEditor.css`:

### Container & Sections
- `template-editor-container` - Main wrapper
- `template-section` - Section container
- `template-output-section` - For section 3
- `section-header` - Collapsible header
- `section-header non-collapsible` - Non-collapsible header
- `section-content` - Section body
- `section-number` - Number badge (1, 2, 3)
- `section-title` - Section title text
- `section-summary` - Collapsed summary text
- `section-chevron` - Expand/collapse chevron

### Template Output
- `template-output` - Generated template container
- `template-output-content` - Content wrapper
- `template-line` - Each line of template
- `condition-line` - Condition branch lines
- `fallback-line` - Fallback/expansion rule lines
- `default-fallback` - Final fallback line
- `template-instruction` - "Fill in the blue dropdowns" text
- `highlight-text` - Blue highlighted text

### Form Elements
- `template-dropdown` - Standard dropdown (blue styling)
- `template-dropdown small` - Smaller dropdown for numbers
- `template-dropdown has-error` - Error state
- `inline-add-btn` - Plus button for adding
- `inline-remove-btn` - X button for removing
- `var-description-input` - Variable description input

### Variables
- `variables-grid` - Two-column grid
- `variable-category` - Category container
- `category-title` - Category header
- `selected-variables-list` - List of selected vars
- `selected-variable-item` - Individual variable
- `add-variable-dropdown` - Add variable dropdown

### Branches
- `branch-number-input-group` - Branch count input wrapper
- `branch-number-input` - Number input
- `branch-example-box` - Example explanation box

### Validation
- `validation-errors` - Error container
- `validation-error-header` - Error header
- `validation-error-list` - Error list

### Actions
- `template-actions` - Action buttons container
- `apply-template-btn` - Primary action button
- `regenerate-btn` - Modify button

## Required Patterns

### 1. Variable Selection is Optional
```tsx
const canGenerateTemplate = numberOfBranches >= 1;  // NOT checking variables
```

### 2. Branch Limits (1-5, default 2)
```tsx
const [numberOfBranches, setNumberOfBranches] = useState<number>(2);  // Default 2

onChange={(e) => setNumberOfBranches(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
min={1}
max={5}
```

### 3. Dynamic Placeholder Examples
Placeholders must be dynamic based on the selected variable name:
```tsx
// For both Context and LWI Variables:
placeholder={`Describe how this appears in policy (e.g., "${v.label.toLowerCase()}")`}
```
This ensures the example is relevant to the selected variable (e.g., "customer region" for Customer Region).

### 4. Validation Pattern
```tsx
const validateBranches = (): { branchId: string; fieldId: string; message: string }[] => {
  const errors = [];
  branches.forEach((branch, branchIndex) => {
    // Check required fields
    if (!branch.requiredField) {
      errors.push({
        branchId: branch.id,
        fieldId: 'fieldName',
        message: `Branch ${branchIndex + 1}: Please select...`
      });
    }
  });
  return errors;
};

const hasError = (branchId: string, fieldId: string): boolean => {
  return validationErrors.some(e => e.branchId === branchId && e.fieldId === fieldId);
};
```

### 5. Apply Handler
```tsx
const handleApplyTemplate = () => {
  const errors = validateBranches();
  setValidationErrors(errors);
  if (errors.length > 0) return;

  const prompt = generateFinalPrompt();
  const config: PolicyConfig = { /* ... */ };

  if (onPromptGenerated) {
    onPromptGenerated(prompt, config);
  }
};
```

## Shared Components

### MultiSelectDropdown
Reuse this component for multi-value selection with include/exclude mode:

```tsx
<MultiSelectDropdown
  options={['Option1', 'Option2']}
  selected={selectedValues}
  onChange={(values) => handleChange(values)}
  placeholder="choose"
  excludeMode={isExcludeMode}
  onExcludeModeChange={(exclude) => setExcludeMode(exclude)}
  hasError={hasError(branchId, fieldId)}
/>
```

## Example: Ring Expansion Editor

See `RingExpansionEditor.tsx` for a complete implementation example that includes:
- User group selection
- Wait time configuration
- Multiple expansion rules with add/remove
- Restricted vs open fallback modes

## Navigation Setup

In `AgCDHome.tsx`, add navigation handler:
```tsx
const handleYourScenarioSelect = (optionId: string) => {
  navigate(`/agcd/prompt/${optionId}?mode=template&scenario=${optionId}&requirement=${encodeURIComponent(nlRequirement)}`);
};
```
