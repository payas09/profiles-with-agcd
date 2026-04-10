/**
 * JsonRuleReviewer - User-friendly view of the generated workflow JSON
 *
 * This component shows a side-by-side comparison of:
 * - Left: The original natural language prompt
 * - Right: The parsed conditions from JSON in a user-friendly format
 *
 * Users can review and edit the parsed conditions. Edits directly update
 * the JSON without calling any LLM.
 */

import React, { useState, useEffect } from 'react';
import './JsonRuleReviewer.css';

// Action type mappings for display
const actionTypeLabels: { [key: string]: string } = {
  'ExternalTransfer': 'Transfer to External Number',
  'TransferToQueue': 'Transfer to Queue',
  'OfferScheduledCallback': 'Offer Scheduled Callback',
  'OfferDirectCallback': 'Offer Direct Callback',
  'OfferVoicemail': 'Send to Voicemail',
  'EndConversation': 'End Conversation',
};

const actionTypeIcons: { [key: string]: string } = {
  'ExternalTransfer': '📞',
  'TransferToQueue': '🔄',
  'OfferScheduledCallback': '📅',
  'OfferDirectCallback': '📲',
  'OfferVoicemail': '📧',
  'EndConversation': '🔚',
};

// Interface for a parsed condition
interface ParsedCondition {
  variable: string;
  variableLabel: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: string;
}

// Interface for a condition group (AND/OR)
interface ConditionGroup {
  type: 'AND' | 'OR';
  conditions: (ParsedCondition | ConditionGroup)[];
}

// Interface for a parsed overflow condition (renamed from "rule")
interface ParsedOverflowCondition {
  id: string;
  name: string;
  conditions: ConditionGroup | ParsedCondition | null;
  action: {
    type: string;
    typeLabel: string;
    icon: string;
    details: { [key: string]: string };
  };
  hasConditions: boolean;
}

// Interface for the workflow JSON
interface WorkflowJson {
  $schema?: string;
  contentVersion?: string;
  triggers?: { [key: string]: any };
  actions?: { [key: string]: WorkflowAction };
  outputs?: { [key: string]: any };
}

interface WorkflowAction {
  type: string;
  inputs?: {
    data?: {
      phoneNumber?: string;
      targetQueue?: string;
      outboundProfileWSId?: string;
    };
  };
  runAfter?: { [key: string]: string[] };
  expression?: any;
}

interface JsonRuleReviewerProps {
  originalPrompt: string;
  workflowJson: WorkflowJson | string;
  onJsonChange: (updatedJson: WorkflowJson) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Parse variable name from "ContextVariable.X" or "LiveWorkItem.X"
const parseVariableName = (varPath: string): { source: string; name: string; label: string } => {
  const parts = varPath.split('.');
  const source = parts[0] || 'Unknown';
  const name = parts[1] || varPath;

  // Generate a friendly label
  const labelMap: { [key: string]: string } = {
    'CustomerTier': 'Customer Tier',
    'ServicePlan': 'Service Plan',
    'Region': 'Customer Region',
    'bm_CustomerCluster': 'Customer Cluster',
    'IsVIP': 'Is VIP Customer',
    'Language': 'Preferred Language',
    'AccountType': 'Account Type',
    'Intent': 'Conversation Intent',
    'Channel': 'Channel',
    'Priority': 'Priority',
    'Sentiment': 'Customer Sentiment',
  };

  return {
    source,
    name,
    label: labelMap[name] || name.replace(/([A-Z])/g, ' $1').trim()
  };
};

// Parse expression to condition group or single condition
const parseExpression = (expression: any): ConditionGroup | ParsedCondition | null => {
  if (!expression || Object.keys(expression).length === 0) {
    return null;
  }

  // Handle direct equals (single condition, not nested)
  if (expression.equals && Array.isArray(expression.equals)) {
    const varInfo = parseVariableName(expression.equals[0]);
    return {
      variable: expression.equals[0],
      variableLabel: varInfo.label,
      operator: 'equals',
      value: expression.equals[1]
    };
  }

  // Handle AND conditions
  if (expression.and && Array.isArray(expression.and)) {
    const conditions: (ParsedCondition | ConditionGroup)[] = [];

    for (const cond of expression.and) {
      if (cond.equals) {
        const varInfo = parseVariableName(cond.equals[0]);
        conditions.push({
          variable: cond.equals[0],
          variableLabel: varInfo.label,
          operator: 'equals',
          value: cond.equals[1]
        });
      } else if (cond.or) {
        const nestedGroup = parseExpression({ or: cond.or });
        if (nestedGroup) {
          conditions.push(nestedGroup as ConditionGroup);
        }
      } else if (cond.and) {
        const nestedGroup = parseExpression({ and: cond.and });
        if (nestedGroup) {
          conditions.push(nestedGroup as ConditionGroup);
        }
      }
    }

    return { type: 'AND', conditions };
  }

  // Handle OR conditions
  if (expression.or && Array.isArray(expression.or)) {
    const conditions: (ParsedCondition | ConditionGroup)[] = [];

    for (const cond of expression.or) {
      if (cond.equals) {
        const varInfo = parseVariableName(cond.equals[0]);
        conditions.push({
          variable: cond.equals[0],
          variableLabel: varInfo.label,
          operator: 'equals',
          value: cond.equals[1]
        });
      } else if (cond.and) {
        const nestedGroup = parseExpression({ and: cond.and });
        if (nestedGroup) {
          conditions.push(nestedGroup as ConditionGroup);
        }
      } else if (cond.or) {
        const nestedGroup = parseExpression({ or: cond.or });
        if (nestedGroup) {
          conditions.push(nestedGroup as ConditionGroup);
        }
      }
    }

    return { type: 'OR', conditions };
  }

  return null;
};

// Parse workflow JSON to overflow conditions
const parseWorkflowToConditions = (workflow: WorkflowJson): ParsedOverflowCondition[] => {
  const parsedConditions: ParsedOverflowCondition[] = [];

  if (!workflow.actions) {
    return parsedConditions;
  }

  Object.entries(workflow.actions).forEach(([actionName, action]) => {
    const actionType = action.type;
    const actionLabel = actionTypeLabels[actionType] || actionType;
    const actionIcon = actionTypeIcons[actionType] || '⚡';

    // Parse action details
    const details: { [key: string]: string } = {};
    if (action.inputs?.data) {
      if (action.inputs.data.phoneNumber) {
        details['Phone Number'] = action.inputs.data.phoneNumber;
      }
      if (action.inputs.data.targetQueue) {
        const queueValue = action.inputs.data.targetQueue;
        details['Queue'] = queueValue;
      }
      if (action.inputs.data.outboundProfileWSId) {
        const profileId = action.inputs.data.outboundProfileWSId;
        details['Profile ID'] = profileId;
      }
    }

    // Parse conditions
    const conditions = parseExpression(action.expression);

    // Only add if there are conditions (skip empty/catch-all)
    if (conditions !== null) {
      parsedConditions.push({
        id: actionName,
        name: actionName,
        conditions,
        action: {
          type: actionType,
          typeLabel: actionLabel,
          icon: actionIcon,
          details
        },
        hasConditions: true
      });
    }
  });

  return parsedConditions;
};

// Check if condition is a group or simple condition
const isConditionGroup = (condition: ParsedCondition | ConditionGroup): condition is ConditionGroup => {
  return 'type' in condition && 'conditions' in condition;
};

// Component to render a condition (recursive for nested groups)
interface ConditionDisplayProps {
  condition: ParsedCondition | ConditionGroup;
  level: number;
  onValueChange?: (variable: string, newValue: string) => void;
  isEditing?: boolean;
}

const ConditionDisplay: React.FC<ConditionDisplayProps> = ({
  condition,
  level,
  onValueChange,
  isEditing = false
}) => {
  // Check if it's a group or a simple condition
  if (isConditionGroup(condition)) {
    // It's a condition group (AND/OR)
    const group = condition;
    const isOr = group.type === 'OR';

    return (
      <div className={`condition-group ${isOr ? 'or-group' : 'and-group'} level-${level}`}>
        <div className="group-label">
          <span className={`group-type-badge ${isOr ? 'or' : 'and'}`}>
            {isOr ? 'ANY of these' : 'ALL of these'}
          </span>
        </div>
        <div className="group-conditions">
          {group.conditions.map((cond, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <div className={`condition-connector ${isOr ? 'or' : 'and'}`}>
                  {isOr ? 'OR' : 'AND'}
                </div>
              )}
              <ConditionDisplay
                condition={cond}
                level={level + 1}
                onValueChange={onValueChange}
                isEditing={isEditing}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // It's a simple condition
  const simpleCondition = condition as ParsedCondition;

  return (
    <div className="simple-condition">
      <span className="condition-variable">{simpleCondition.variableLabel}</span>
      <span className="condition-operator">is</span>
      {isEditing ? (
        <input
          type="text"
          className="condition-value-input"
          value={simpleCondition.value}
          onChange={(e) => onValueChange?.(simpleCondition.variable, e.target.value)}
        />
      ) : (
        <span className="condition-value">"{simpleCondition.value}"</span>
      )}
    </div>
  );
};

// Condition Card Component (renamed from RuleCard)
interface ConditionCardProps {
  condition: ParsedOverflowCondition;
  conditionIndex: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onConditionValueChange: (conditionId: string, variable: string, newValue: string) => void;
  onActionDetailChange: (conditionId: string, detailKey: string, newValue: string) => void;
  onDelete: () => void;
}

const ConditionCard: React.FC<ConditionCardProps> = ({
  condition,
  conditionIndex,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onConditionValueChange,
  onActionDetailChange,
  onDelete
}) => {
  return (
    <div className={`condition-card ${isEditing ? 'editing' : ''}`}>
      <div className="condition-card-header">
        <div className="condition-number">Condition {conditionIndex + 1}</div>
        <div className="condition-actions-buttons">
          {isEditing ? (
            <>
              <button className="condition-btn save" onClick={onSave} title="Save changes">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              <button className="condition-btn cancel" onClick={onCancel} title="Cancel editing">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button className="condition-btn edit" onClick={onEdit} title="Edit">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
              </button>
              <button className="condition-btn delete" onClick={onDelete} title="Delete">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="condition-card-body">
        {/* Conditions Section */}
        <div className="condition-section when-section">
          <div className="section-label">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
            WHEN
          </div>
          <div className="section-content">
            {condition.hasConditions && condition.conditions ? (
              <ConditionDisplay
                condition={condition.conditions}
                level={0}
                onValueChange={(variable, value) => onConditionValueChange(condition.id, variable, value)}
                isEditing={isEditing}
              />
            ) : (
              <div className="no-conditions">
                <span className="no-conditions-text">No conditions specified</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="condition-section action-section">
          <div className="section-label">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
            </svg>
            THEN
          </div>
          <div className="section-content">
            <div className="action-display">
              <span className="action-icon">{condition.action.icon}</span>
              <span className="action-type">{condition.action.typeLabel}</span>
              {Object.entries(condition.action.details).map(([key, value]) => (
                <div key={key} className="action-detail">
                  <span className="detail-label">{key}:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="detail-value-input"
                      value={value}
                      onChange={(e) => onActionDetailChange(condition.id, key, e.target.value)}
                    />
                  ) : (
                    <span className="detail-value">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const JsonRuleReviewer: React.FC<JsonRuleReviewerProps> = ({
  originalPrompt,
  workflowJson,
  onJsonChange,
  onConfirm,
  onCancel
}) => {
  const [parsedConditions, setParsedConditions] = useState<ParsedOverflowCondition[]>([]);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const [editedConditions, setEditedConditions] = useState<ParsedOverflowCondition[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowJson | null>(null);

  // Parse JSON on mount or when it changes
  useEffect(() => {
    let parsedWorkflow: WorkflowJson;

    if (typeof workflowJson === 'string') {
      try {
        parsedWorkflow = JSON.parse(workflowJson);
      } catch (e) {
        console.error('Failed to parse workflow JSON:', e);
        return;
      }
    } else {
      parsedWorkflow = workflowJson;
    }

    setWorkflow(parsedWorkflow);
    const conditions = parseWorkflowToConditions(parsedWorkflow);
    setParsedConditions(conditions);
    setEditedConditions(conditions);
  }, [workflowJson]);

  const handleEditCondition = (conditionId: string) => {
    setEditingConditionId(conditionId);
  };

  const handleSaveCondition = () => {
    // Update the workflow JSON with edited values
    if (workflow) {
      // For now, just update the parsed conditions
      setParsedConditions([...editedConditions]);
      onJsonChange(workflow);
    }
    setEditingConditionId(null);
  };

  const handleCancelEdit = () => {
    setEditedConditions([...parsedConditions]);
    setEditingConditionId(null);
  };

  const handleConditionValueChange = (conditionId: string, variable: string, newValue: string) => {
    setEditedConditions(prev => prev.map(cond => {
      if (cond.id !== conditionId || !cond.conditions) return cond;

      // Deep clone the condition
      const updatedCond = JSON.parse(JSON.stringify(cond));

      // Recursively update the condition value
      const updateConditionValue = (c: ParsedCondition | ConditionGroup): void => {
        if (isConditionGroup(c)) {
          c.conditions.forEach(nested => updateConditionValue(nested));
        } else if (c.variable === variable) {
          c.value = newValue;
        }
      };

      if (updatedCond.conditions) {
        updateConditionValue(updatedCond.conditions);
      }
      return updatedCond;
    }));
  };

  const handleActionDetailChange = (conditionId: string, detailKey: string, newValue: string) => {
    setEditedConditions(prev => prev.map(cond => {
      if (cond.id !== conditionId) return cond;

      return {
        ...cond,
        action: {
          ...cond.action,
          details: {
            ...cond.action.details,
            [detailKey]: newValue
          }
        }
      };
    }));
  };

  const handleDeleteCondition = (conditionId: string) => {
    if (window.confirm('Are you sure you want to delete this condition?')) {
      setEditedConditions(prev => prev.filter(cond => cond.id !== conditionId));
      setParsedConditions(prev => prev.filter(cond => cond.id !== conditionId));
    }
  };

  return (
    <div className="json-rule-reviewer">
      <div className="reviewer-header">
        <h2 className="reviewer-title">Review Generated Conditions</h2>
        <p className="reviewer-subtitle">
          Compare the original prompt with the parsed conditions. Edit any values that need correction.
        </p>
      </div>

      <div className="reviewer-content">
        {/* Left Panel - Original Prompt */}
        <div className="reviewer-panel original-prompt-panel">
          <div className="panel-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm3.083 2.5h4.834a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H5.583a2.5 2.5 0 0 1-2.5-2.5V6a2.5 2.5 0 0 1 2.5-2.5z"/>
            </svg>
            <span>What You Wrote</span>
          </div>
          <div className="panel-content">
            <pre className="original-prompt-text">{originalPrompt}</pre>
          </div>
        </div>

        {/* Right Panel - Parsed Conditions */}
        <div className="reviewer-panel parsed-rules-panel">
          <div className="panel-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            <span>What the System Understood</span>
          </div>
          <div className="panel-content">
            {editedConditions.length > 0 ? (
              <div className="conditions-list">
                {editedConditions.map((condition, index) => (
                  <ConditionCard
                    key={condition.id}
                    condition={condition}
                    conditionIndex={index}
                    isEditing={editingConditionId === condition.id}
                    onEdit={() => handleEditCondition(condition.id)}
                    onSave={handleSaveCondition}
                    onCancel={handleCancelEdit}
                    onConditionValueChange={handleConditionValueChange}
                    onActionDetailChange={handleActionDetailChange}
                    onDelete={() => handleDeleteCondition(condition.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-conditions-message">
                <p>No conditions could be parsed from the JSON.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="reviewer-footer">
        <div className="footer-hint">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          <span>Click the edit icon on any condition to make changes. Changes are saved directly without re-processing.</span>
        </div>
        <div className="footer-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonRuleReviewer;
