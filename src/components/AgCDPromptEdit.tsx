import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import './AgCDPromptEdit.css';
import { savePrompt, getPrompt, SelectionMode, TemplateState, ChannelType } from '../utils/promptStorage';
// import TemplatePromptEditor from './TemplatePromptEditor';
import CopilotPromptEditor from './CopilotPromptEditor';
import TemplateBasedEditor from './TemplateBasedEditor';
import type { TemplateEditorState } from './OverflowHandlingEditor';
import type { ExpertRoutingEditorState } from './TemplateBasedEditor';

// Policy config interface for editable display
interface ConditionDef {
  variableId: string;
  variableLabel: string;
  variableType: 'context' | 'lwi';
  values: string[];
}

interface AssignmentCondition {
  id: string;
  conditions: ConditionDef[];
  action: 'preferred-expert' | 'previous-expert' | 'queue-strategy';
  lookbackPeriod?: number;
  userAttributes?: { id: string; value: string }[];
}

interface PolicyConfig {
  selectedVariables: { id: string; label: string; type: 'context' | 'lwi' }[];
  conditions: AssignmentCondition[];
  defaultAction: 'queue-strategy';
}

// Engagement profiles data
const engagementProfiles = [
  { id: 'profile1', name: 'Standard Support Profile' },
  { id: 'profile2', name: 'VIP Customer Profile' },
  { id: 'profile3', name: 'Technical Support Profile' },
  { id: 'profile4', name: 'Sales Team Profile' },
  { id: 'profile5', name: 'After-Hours Profile' },
  { id: 'profile6', name: 'Billing Support Profile' }
];

// Queue to profile mappings with channel
const queueProfileMappings = [
  { queueId: 'q1', queueName: 'General Support Queue', profileId: 'profile1', profileName: 'Standard Support Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q2', queueName: 'VIP Support Queue', profileId: 'profile2', profileName: 'VIP Customer Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q3', queueName: 'Technical Support Queue', profileId: 'profile3', profileName: 'Technical Support Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q4', queueName: 'Sales Queue', profileId: 'profile4', profileName: 'Sales Team Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q5', queueName: 'Billing Queue', profileId: 'profile6', profileName: 'Billing Support Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q6', queueName: 'Chat Support Queue', profileId: 'profile1', profileName: 'Standard Support Profile', channel: 'Messaging' as ChannelType },
  { queueId: 'q7', queueName: 'Live Chat Queue', profileId: 'profile1', profileName: 'Standard Support Profile', channel: 'Messaging' as ChannelType },
  { queueId: 'q8', queueName: 'Case Management Queue', profileId: 'profile1', profileName: 'Standard Support Profile', channel: 'Messaging' as ChannelType },
  { queueId: 'q9', queueName: 'Emergency Queue', profileId: 'profile2', profileName: 'VIP Customer Profile', channel: 'Voice' as ChannelType },
  { queueId: 'q10', queueName: 'After Hours Queue', profileId: 'profile5', profileName: 'After-Hours Profile', channel: 'Messaging' as ChannelType },
];

// Trigger events
const triggerEvents = [
  { id: 'conversation-waiting', label: 'Conversation is waiting in queue' },
  { id: 'conversation-transferred', label: 'Conversation is transferred' }
];

// Prompt templates
const promptTemplates: { [key: string]: { title: string; type: string; description: string; defaultPrompt: string } } = {
  // Dynamic prioritization
  'wait-time-escalation': {
    title: 'Escalate priority based on wait time',
    type: 'Orchestrator',
    description: 'Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.',
    defaultPrompt: 'Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.'
  },
  'queue-transfer-escalation': {
    title: 'Escalate priority based on transfer to queue',
    type: 'Orchestrator',
    description: 'Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.',
    defaultPrompt: 'Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.'
  },
  // Overflow handling
  'overflow-conditions-actions': {
    title: 'Configure combination of overflow conditions and actions',
    type: 'Orchestrator',
    description: 'Set up overflow rules combining multiple conditions (wait time, agent availability, queue status) with actions (transfer, callback, voicemail).',
    defaultPrompt: 'For customers where the estimated average wait time > 5 minutes or all agents are offline, transfer to Overflow Queue.'
  },
  'overflow-conversation-accepted': {
    title: 'Configure overflow based on conversation accepted by CSR',
    type: 'Orchestrator',
    description: 'Trigger overflow actions when a conversation is accepted by a customer service representative.',
    defaultPrompt: 'When a conversation is accepted by a CSR, perform the configured overflow action.'
  },
  'overflow-conversation-rejected': {
    title: 'Configure overflow based on conversation rejected by CSR',
    type: 'Orchestrator',
    description: 'Trigger overflow actions when a conversation is rejected by a customer service representative.',
    defaultPrompt: 'When a conversation is rejected by a CSR, transfer to the next available queue or offer callback.'
  },
  'overflow-missed-notification': {
    title: 'Configure overflow based on missed notification',
    type: 'Orchestrator',
    description: 'Trigger overflow actions when an agent misses a notification for an incoming conversation.',
    defaultPrompt: 'When an agent misses a notification, expand to additional agents or transfer to overflow queue.'
  },
  // Automated messages
  'interval-messages': {
    title: 'Play message at specific time intervals',
    type: 'Orchestrator',
    description: 'Deliver automated messages to customers at defined time intervals during their wait.',
    defaultPrompt: 'Deliver automated messages to customers at defined time intervals during their wait.'
  },
  'frequent-messages-overflow': {
    title: 'Combine frequent messages with overflow actions',
    type: 'Orchestrator',
    description: 'Coordinate automated messaging with overflow routing to keep customers informed.',
    defaultPrompt: 'Coordinate automated messaging with overflow routing to keep customers informed.'
  },
  // Callback handling
  'transfer-callback-queue': {
    title: 'Transfer to dedicated callback queue',
    type: 'Orchestrator',
    description: 'Route callback requests to a dedicated queue optimized for handling scheduled and direct callbacks.',
    defaultPrompt: 'When a callback is requested, transfer the conversation to the dedicated callback queue for processing.'
  },
  // Assignment prompts
  'preferred-then-last-expert': {
    title: 'Assign to preferred expert and then last interacted expert',
    type: 'Assignment',
    description: 'First attempt to assign to the customer\'s preferred expert, then fall back to the last expert they interacted with.',
    defaultPrompt: 'First attempt to assign to the customer\'s preferred expert, then fall back to the last expert they interacted with.'
  },
  'last-interacted-expert': {
    title: 'Assign to last interacted expert',
    type: 'Assignment',
    description: 'Route conversations to the expert who most recently handled this customer\'s previous interactions.',
    defaultPrompt: 'Route conversations to the expert who most recently handled this customer\'s previous interactions.'
  },
  'callback-creator': {
    title: 'Assign to expert who created the callback',
    type: 'Assignment',
    description: 'Route scheduled callbacks to the same expert who originally created the callback request.',
    defaultPrompt: 'Route scheduled callbacks to the same expert who originally created the callback request.'
  },
  'reattempt-callback-assignment': {
    title: 'Reattempt assignment to expert who created the callback',
    type: 'Assignment',
    description: 'If the callback creator is unavailable, retry assignment to them before routing to other experts.',
    defaultPrompt: 'If the callback creator is unavailable, retry assignment to them before routing to other experts.'
  },
  'ring-expansion-restricted': {
    title: 'Ring expansion with restricted fallback',
    type: 'Assignment',
    description: 'Expand assignment progressively based on wait time, but restrict to defined user groups only.',
    defaultPrompt: 'Assign the conversations to Senior Support Agents or Technical Specialists. If no support rep is available or the conversation remains unassigned for 30 seconds, expand to Standard Support Team. If the conversation is still unassigned after 60 seconds, expand to Escalation team. Do not open the conversation to any other users in the queue.'
  },
  'ring-expansion-open': {
    title: 'Ring expansion with open fallback',
    type: 'Assignment',
    description: 'Expand assignment progressively based on wait time, with final fallback to any queue member.',
    defaultPrompt: 'Assign the conversations to Senior Support Agents or Technical Specialists. If no support rep is available or the conversation remains unassigned for 30 seconds, expand to Standard Support Team. If the conversation is still unassigned after 60 seconds, expand to Escalation team. If the conversation still remains unassigned, assign to any member of the queue.'
  },
  // Legacy templates for backward compatibility
  'overflow': {
    title: 'Overflow',
    type: 'Orchestrator',
    description: 'Manage queue overflow scenarios with intelligent routing',
    defaultPrompt: 'If queue wait time is greater than 5 minutes, then route to available overflow queue and communicate with customer whenever overflow is triggered.'
  },
  'assignment': {
    title: 'Assignment',
    type: 'Assignment',
    description: 'Define intelligent work assignment rules',
    defaultPrompt: 'Implement skill-based routing with preference for agents who have successfully resolved similar cases in the past 30 days.'
  },
  'automated-messages': {
    title: 'Automated Messages',
    type: 'Orchestrator',
    description: 'Configure automated customer messages',
    defaultPrompt: 'Send welcome message when customer connects, provide wait time updates every 2 minutes, and send closing message when conversation ends.'
  },
  'dynamic-prioritization': {
    title: 'Dynamic Prioritization',
    type: 'Assignment',
    description: 'Dynamically adjust work item priorities',
    defaultPrompt: 'Prioritize work items based on customer sentiment, wait time, and issue severity. Escalate items waiting more than 10 minutes or with negative sentiment.'
  },
  'orchestrator': {
    title: 'Orchestrator',
    type: 'Orchestrator',
    description: 'Orchestrate complex multi-step workflows',
    defaultPrompt: 'Orchestrate the workflow to handle complex scenarios.'
  }
};

interface ProfileWithQueues {
  profileId: string;
  profileName: string;
  queues: string[];
}

// Generate prompt from policy config
const generatePromptFromConfig = (config: PolicyConfig): string => {
  const lines: string[] = [];

  // Variables section
  if (config.selectedVariables.length > 0) {
    const varParts = config.selectedVariables.map(v => {
      if (v.type === 'context') {
        return `the customer's ${v.label} from ContextVariable.${v.id}`;
      } else {
        return `the ${v.label} from LiveWorkItem.${v.id}`;
      }
    });
    lines.push(`Get ${varParts.join(' and ')}.`);
    lines.push('');
  }

  // Conditions
  config.conditions.forEach((cond, index) => {
    const conditionParts = cond.conditions.map(c => {
      const valueText = c.values.length > 1 ? c.values.join(' or ') : c.values[0];
      return `${c.variableLabel} is ${valueText}`;
    });

    const conditionText = conditionParts.join(' and ');

    let actionText = '';
    if (cond.action === 'preferred-expert') {
      actionText = 'should be first offered to one of the preferred experts mapped to them';
    } else if (cond.action === 'previous-expert') {
      actionText = `should be assigned to a previous expert who has interacted with the customer in the last ${cond.lookbackPeriod || 14} days`;

      if (cond.userAttributes && cond.userAttributes.length > 0) {
        const attrParts = cond.userAttributes.filter(a => a.value).map(attr => {
          if (attr.id === 'CSAT') return `minimum CSAT of ${attr.value}`;
          if (attr.id === 'ResolutionRate') return `Resolution Rate above ${attr.value}`;
          if (attr.id === 'Skills') return `${attr.value} skill`;
          if (attr.id === 'Language') return `speaks ${attr.value}`;
          return '';
        }).filter(Boolean);

        if (attrParts.length > 0) {
          actionText += ` and has ${attrParts.join(' and ')}`;
        }
      }
    } else {
      actionText = "should be assigned based on the queue's assignment strategy";
    }

    lines.push(`${index === 0 ? 'All' : 'For'} customers where ${conditionText} ${actionText}.`);
    lines.push('');
  });

  // Default fallback
  lines.push("For all other cases, assign to the next best expert in the queue based on the queue's assignment strategy.");

  return lines.join('\n');
};

// Editable Policy Display Component
interface EditablePolicyDisplayProps {
  config: PolicyConfig;
  onConfigChange: (config: PolicyConfig) => void;
}

const EditablePolicyDisplay: React.FC<EditablePolicyDisplayProps> = ({ config, onConfigChange }) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  // Update condition values
  const handleConditionValueChange = (condId: string, conditionVarId: string, newValue: string) => {
    const updatedConditions = config.conditions.map(cond => {
      if (cond.id === condId) {
        return {
          ...cond,
          conditions: cond.conditions.map(c =>
            c.variableId === conditionVarId
              ? { ...c, values: newValue.split(',').map(v => v.trim()).filter(Boolean) }
              : c
          )
        };
      }
      return cond;
    });
    onConfigChange({ ...config, conditions: updatedConditions });
    setEditingField(null);
  };

  // Update lookback period
  const handleLookbackChange = (condId: string, value: number) => {
    const updatedConditions = config.conditions.map(cond =>
      cond.id === condId ? { ...cond, lookbackPeriod: value } : cond
    );
    onConfigChange({ ...config, conditions: updatedConditions });
    setEditingField(null);
  };

  // Update user attribute
  const handleUserAttrChange = (condId: string, attrId: string, newValue: string) => {
    const updatedConditions = config.conditions.map(cond => {
      if (cond.id === condId) {
        const existingAttrs = cond.userAttributes || [];
        const updatedAttrs = existingAttrs.filter(a => a.id !== attrId);
        if (newValue) {
          updatedAttrs.push({ id: attrId, value: newValue });
        }
        return { ...cond, userAttributes: updatedAttrs };
      }
      return cond;
    });
    onConfigChange({ ...config, conditions: updatedConditions });
    setEditingField(null);
  };

  // Get action display text
  const getActionText = (action: string) => {
    switch (action) {
      case 'preferred-expert': return 'Assign to Preferred Expert';
      case 'previous-expert': return 'Assign to Previous Expert';
      case 'queue-strategy': return 'Use Queue Strategy';
      default: return action;
    }
  };

  return (
    <div className="editable-policy-container">
      {/* Variables Section */}
      {config.selectedVariables.length > 0 && (
        <div className="editable-policy-line">
          <span className="policy-text">Get </span>
          {config.selectedVariables.map((v, idx) => (
            <React.Fragment key={v.id}>
              {idx > 0 && <span className="policy-text"> and </span>}
              {v.type === 'context' ? (
                <>
                  <span className="policy-text">the customer's {v.label} from </span>
                  <span className="policy-editable-value non-editable">ContextVariable.{v.id}</span>
                </>
              ) : (
                <>
                  <span className="policy-text">the {v.label} from </span>
                  <span className="policy-editable-value non-editable">LiveWorkItem.{v.id}</span>
                </>
              )}
            </React.Fragment>
          ))}
          <span className="policy-text">.</span>
        </div>
      )}

      {/* Conditions Section */}
      {config.conditions.map((cond, condIdx) => (
        <div key={cond.id} className="editable-policy-condition" style={{ marginTop: '16px' }}>
          <div className="policy-condition-header">
            <span className="policy-condition-number">Condition {condIdx + 1}</span>
          </div>
          <div className="editable-policy-line">
            <span className="policy-text">{condIdx === 0 ? 'All' : 'For'} customers where </span>
            {cond.conditions.map((condition, idx) => (
              <React.Fragment key={condition.variableId}>
                {idx > 0 && <span className="policy-text"> and </span>}
                <span className="policy-text">{condition.variableLabel} is </span>
                {editingField === `cond-${cond.id}-var-${condition.variableId}` ? (
                  <span className="policy-editable-value editing">
                    <input
                      type="text"
                      className="policy-editable-input"
                      value={condition.values.join(', ')}
                      onChange={(e) => handleConditionValueChange(cond.id, condition.variableId, e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                      autoFocus
                    />
                  </span>
                ) : (
                  <span
                    className="policy-editable-value"
                    onClick={() => setEditingField(`cond-${cond.id}-var-${condition.variableId}`)}
                    title="Click to edit"
                  >
                    {condition.values.join(' or ')}
                    <span className="policy-edit-icon">✎</span>
                  </span>
                )}
              </React.Fragment>
            ))}
            <span className="policy-text"> → </span>
            <span className="policy-action-badge">{getActionText(cond.action)}</span>

            {/* Show lookback period for previous-expert action */}
            {cond.action === 'previous-expert' && (
              <>
                <span className="policy-text"> (last </span>
                {editingField === `cond-${cond.id}-lookback` ? (
                  <span className="policy-editable-value editing">
                    <input
                      type="number"
                      className="policy-editable-input"
                      value={cond.lookbackPeriod || 14}
                      onChange={(e) => handleLookbackChange(cond.id, parseInt(e.target.value) || 14)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                      autoFocus
                      min={1}
                      max={90}
                    />
                  </span>
                ) : (
                  <span
                    className="policy-editable-value"
                    onClick={() => setEditingField(`cond-${cond.id}-lookback`)}
                    title="Click to edit"
                  >
                    {cond.lookbackPeriod || 14}
                    <span className="policy-edit-icon">✎</span>
                  </span>
                )}
                <span className="policy-text"> days</span>

                {/* User attributes */}
                {cond.userAttributes && cond.userAttributes.some(a => a.value) && (
                  <>
                    <span className="policy-text">, </span>
                    {cond.userAttributes.filter(a => a.value).map((attr, attrIdx) => (
                      <React.Fragment key={attr.id}>
                        {attrIdx > 0 && <span className="policy-text">, </span>}
                        {attr.id === 'CSAT' && (
                          <>
                            <span className="policy-text">CSAT ≥ </span>
                            {editingField === `cond-${cond.id}-attr-${attr.id}` ? (
                              <span className="policy-editable-value editing">
                                <input
                                  type="text"
                                  className="policy-editable-input"
                                  value={attr.value}
                                  onChange={(e) => handleUserAttrChange(cond.id, attr.id, e.target.value)}
                                  onBlur={() => setEditingField(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                  autoFocus
                                />
                              </span>
                            ) : (
                              <span
                                className="policy-editable-value"
                                onClick={() => setEditingField(`cond-${cond.id}-attr-${attr.id}`)}
                                title="Click to edit"
                              >
                                {attr.value}
                                <span className="policy-edit-icon">✎</span>
                              </span>
                            )}
                          </>
                        )}
                        {attr.id === 'ResolutionRate' && (
                          <>
                            <span className="policy-text">Resolution ≥ </span>
                            {editingField === `cond-${cond.id}-attr-${attr.id}` ? (
                              <span className="policy-editable-value editing">
                                <input
                                  type="text"
                                  className="policy-editable-input"
                                  value={attr.value}
                                  onChange={(e) => handleUserAttrChange(cond.id, attr.id, e.target.value)}
                                  onBlur={() => setEditingField(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                  autoFocus
                                />
                              </span>
                            ) : (
                              <span
                                className="policy-editable-value"
                                onClick={() => setEditingField(`cond-${cond.id}-attr-${attr.id}`)}
                                title="Click to edit"
                              >
                                {attr.value}
                                <span className="policy-edit-icon">✎</span>
                              </span>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
                <span className="policy-text">)</span>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Default Fallback */}
      <div className="editable-policy-line" style={{ marginTop: '16px' }}>
        <span className="policy-text policy-fallback">For all other cases → Use Queue's Assignment Strategy</span>
      </div>
    </div>
  );
};

const AgCDPromptEdit: React.FC = () => {
  const { promptType, policyId } = useParams<{ promptType?: string; policyId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Detect if we're in the public preview flow
  const isPublicPreview = location.pathname.startsWith('/agcd-preview');
  const basePath = isPublicPreview ? '/agcd-preview' : '/agcd';

  // Determine if we're editing an existing policy or creating a new one
  const isEditMode = !!policyId;
  const currentId = policyId || promptType || '';
  const template = promptType ? promptTemplates[promptType] : null;

  // Get URL parameters for template mode
  const urlMode = searchParams.get('mode');
  const urlRequirement = searchParams.get('requirement');
  const urlScenario = searchParams.get('scenario');

  const [promptName, setPromptName] = useState('');
  const [policyBehavior, setPolicyBehavior] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileWithQueues[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all');
  const [selectedTrigger, setSelectedTrigger] = useState('conversation-waiting');
  const [status, setStatus] = useState<'Draft' | 'Active'>('Draft');
  const [policyType, setPolicyType] = useState<string>('Orchestrator');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [tempSelectionMode, setTempSelectionMode] = useState<SelectionMode>('all');
  const [tempSelectedProfiles, setTempSelectedProfiles] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('Voice');
  const [tempSelectedChannel, setTempSelectedChannel] = useState<ChannelType>('Voice');
  const [activePageTab, setActivePageTab] = useState<'home' | 'playbook'>('home');
  const [editMode, setEditMode] = useState<'simple' | 'builder' | 'copilot' | 'template'>('template');
  const [policyConfig, setPolicyConfig] = useState<PolicyConfig | null>(null);
  const [nlRequirement, setNlRequirement] = useState<string>('');
  const [templateState, setTemplateState] = useState<TemplateState | undefined>(undefined);
  const [savedScenarioId, setSavedScenarioId] = useState<string | undefined>(undefined);
  // Track if there are unsaved changes (dirty state)
  const [isDirty, setIsDirty] = useState(false);
  // Store the original saved state for reverting
  const [savedTemplateState, setSavedTemplateState] = useState<TemplateState | undefined>(undefined);
  // Show unsaved changes warning dialog
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  // Key to force remount of TemplateBasedEditor when reverting
  const [editorKey, setEditorKey] = useState(0);
  // Ref to track if this is the initial load (skip setting isDirty on first onStateChange)
  const isInitialLoadRef = useRef(true);
  // Ref to track if we just saved (skip setting isDirty on immediate post-save onStateChange)
  const justSavedRef = useRef(false);
  // Ref to store saved state for synchronous comparison (mirrors savedTemplateState)
  const savedTemplateStateRef = useRef<TemplateState | undefined>(undefined);
  // Ref to store current template state for synchronous access (avoids stale state in callbacks)
  const currentTemplateStateRef = useRef<TemplateState | undefined>(undefined);
  // Track the actual policy ID - set when editing existing or after first save of new policy
  const [savedPolicyId, setSavedPolicyId] = useState<string | null>(null);
  // Confirmation modal state
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  // Success banner states
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [showPublishBanner, setShowPublishBanner] = useState(false);
  // Validation state
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | null>(null);
  const [hasValidationWarnings, setHasValidationWarnings] = useState(false);

  // Load saved data or use template defaults
  useEffect(() => {
    if (isEditMode) {
      // Editing existing policy - load from storage
      const savedPrompt = getPrompt(currentId);
      if (savedPrompt) {
        setPromptName(savedPrompt.promptName);
        setPolicyBehavior(savedPrompt.policyBehavior);
        setSelectedProfiles(savedPrompt.selectedProfiles);
        setSelectionMode(savedPrompt.selectionMode);
        // Fix trigger for existing playbooks based on scenarioId
        if (savedPrompt.scenarioId === 'queue-transfer-escalation') {
          setSelectedTrigger('conversation-transferred');
        } else if (savedPrompt.scenarioId === 'wait-time-escalation') {
          setSelectedTrigger('conversation-waiting');
        } else {
          setSelectedTrigger(savedPrompt.selectedTrigger);
        }
        setStatus(savedPrompt.status);
        setPolicyType(savedPrompt.type);
        // Load template state for restoration
        if (savedPrompt.templateState) {
          setTemplateState(savedPrompt.templateState);
          currentTemplateStateRef.current = savedPrompt.templateState; // Keep current state ref in sync
          // Save the original state for reverting (deep copy)
          const stateCopy = JSON.parse(JSON.stringify(savedPrompt.templateState));
          setSavedTemplateState(stateCopy);
          savedTemplateStateRef.current = stateCopy; // Update ref immediately
        }
        // Load scenarioId for correct editor selection
        // Default to 'overflow-conditions-actions' for existing playbooks without scenarioId
        // This ensures all playbooks use the new template experience
        setSavedScenarioId(savedPrompt.scenarioId || 'overflow-conditions-actions');
        // Set the policy ID for consistent saves - use the ID from URL (currentId = policyId)
        setSavedPolicyId(currentId);
        // Load selected channel for public preview
        if (savedPrompt.selectedChannel) {
          setSelectedChannel(savedPrompt.selectedChannel);
        }
      }
    } else if (template) {
      // Creating new policy from template - use template defaults
      setPromptName(template.title);
      setPolicyBehavior(template.defaultPrompt);
      setSelectedProfiles([]);
      setSelectionMode('all');
      // Set trigger based on scenario type
      if (promptType === 'queue-transfer-escalation') {
        setSelectedTrigger('conversation-transferred');
      } else {
        setSelectedTrigger('conversation-waiting');
      }
      setStatus('Draft');
      setPolicyType(template.type);
      setTemplateState(undefined); // No saved state for new policies
      setSavedScenarioId(promptType); // Store the promptType as scenarioId for new policies
      setSavedPolicyId(null); // Will be set on first save
      setSelectedChannel('Voice'); // Default channel for new policies
    }
  }, [currentId, template, isEditMode, promptType]);

  // Handle URL parameters for edit mode (template or copilot)
  useEffect(() => {
    if (urlMode === 'template') {
      setEditMode('template');
      if (urlRequirement) {
        setNlRequirement(decodeURIComponent(urlRequirement));
      }
    } else if (urlMode === 'copilot') {
      setEditMode('copilot');
    }
  }, [urlMode, urlRequirement]);

  // Reset initial load ref when editor is remounted or playbook changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [editorKey, currentId]);

  // Group queues by profile for the side panel
  const profilesWithQueues = engagementProfiles.map(profile => {
    const queues = queueProfileMappings
      .filter(mapping => mapping.profileId === profile.id)
      .map(mapping => mapping.queueName);
    return {
      profileId: profile.id,
      profileName: profile.name,
      queues
    };
  });

  const handleAddProfile = () => {
    setTempSelectionMode(selectionMode);
    setTempSelectedProfiles(selectedProfiles.map(p => p.profileId));
    setTempSelectedChannel(selectedChannel);
    setShowSidePanel(true);
  };

  const handleProfileCheckbox = (profileId: string) => {
    setTempSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSaveProfiles = () => {
    setSelectionMode(tempSelectionMode);
    if (isPublicPreview) {
      setSelectedChannel(tempSelectedChannel);
    }

    if (tempSelectionMode === 'all') {
      setSelectedProfiles([]);
    } else {
      if (isPublicPreview) {
        // For public preview, map queue IDs to profile-like structure for storage
        // Only include queues from the selected channel
        const newSelectedQueues = tempSelectedProfiles
          .map(queueId => {
            const queue = queueProfileMappings.find(q => q.queueId === queueId && q.channel === tempSelectedChannel);
            if (!queue) return null;
            return {
              profileId: queue.queueId,
              profileName: queue.queueName,
              queues: [queue.queueName]
            };
          })
          .filter(Boolean) as { profileId: string; profileName: string; queues: string[] }[];
        setSelectedProfiles(newSelectedQueues);
      } else {
        const newSelectedProfiles = tempSelectedProfiles.map(profileId => {
          const profile = profilesWithQueues.find(p => p.profileId === profileId);
          return profile!;
        });
        setSelectedProfiles(newSelectedProfiles);
      }
    }
    setShowSidePanel(false);
  };

  const handleCancelProfiles = () => {
    setShowSidePanel(false);
    setTempSelectedProfiles([]);
    setTempSelectionMode(selectionMode);
    setTempSelectedChannel(selectedChannel);
  };

  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles(prev => prev.filter(p => p.profileId !== profileId));
  };

  const handleSave = () => {
    // Trigger validation first
    setPendingAction('save');
    setTriggerValidation(true);
  };

  const handlePublishClick = () => {
    // Trigger validation first
    setPendingAction('publish');
    setTriggerValidation(true);
  };

  // Handle validation result from template editor
  const handleValidationResult = (hasWarnings: boolean, _warnings: { message: string }[]) => {
    setTriggerValidation(false);
    setHasValidationWarnings(hasWarnings);

    // For Save: proceed even with warnings (warnings are shown but don't block)
    // For Publish: block if there are warnings
    if (pendingAction === 'save') {
      performSave();
    } else if (pendingAction === 'publish') {
      if (hasWarnings) {
        // Validation warnings - don't proceed with publish
        setPendingAction(null);
        return;
      }
      // No warnings - show confirmation modal
      setShowPublishConfirm(true);
    }
    setPendingAction(null);
  };

  const performSave = () => {
    // Use savedPolicyId if available (existing policy or already saved)
    // Only generate new ID if this is the first save of a new policy
    const id = savedPolicyId || `${promptType}-${Date.now()}`;
    // Use promptType for new, savedScenarioId for existing
    const effectiveScenarioId = promptType || savedScenarioId || urlScenario || undefined;

    // Use ref for current template state to avoid stale state issues
    const currentState = currentTemplateStateRef.current;

    const promptData = {
      id,
      promptName,
      policyBehavior,
      selectedProfiles,
      selectionMode,
      selectedTrigger,
      status,
      lastModified: 'Just now',
      type: policyType,
      templateState: currentState, // Use ref for most up-to-date state
      scenarioId: effectiveScenarioId, // Store which scenario/template was used
      isPublicPreview,
      selectedChannel: isPublicPreview ? selectedChannel : undefined
    };
    savePrompt(id, promptData);

    // Reset dirty state and update saved state for future reverts
    setIsDirty(false);
    justSavedRef.current = true; // Skip next onStateChange from setting isDirty
    if (currentState) {
      const stateCopy = JSON.parse(JSON.stringify(currentState));
      setSavedTemplateState(stateCopy);
      savedTemplateStateRef.current = stateCopy; // Update ref immediately
    }

    // Show success banner
    setShowSaveBanner(true);

    // If this was a new policy (first save), store the ID and navigate to edit mode
    if (!savedPolicyId) {
      setSavedPolicyId(id);
      navigate(`${basePath}/policy/${id}`, { replace: true });
    }
  };

  const handlePublishConfirm = () => {
    // Use savedPolicyId if available (existing policy or already saved)
    // Only generate new ID if this is the first save of a new policy
    const id = savedPolicyId || `${promptType}-${Date.now()}`;
    // Use promptType for new, savedScenarioId for existing
    const effectiveScenarioId = promptType || savedScenarioId || urlScenario || undefined;

    // Use ref for current template state to avoid stale state issues
    const currentState = currentTemplateStateRef.current;

    const promptData = {
      id,
      promptName,
      policyBehavior,
      selectedProfiles,
      selectionMode,
      selectedTrigger,
      status: 'Active' as const,
      lastModified: 'Just now',
      type: policyType,
      templateState: currentState, // Use ref for most up-to-date state
      scenarioId: effectiveScenarioId, // Store which scenario/template was used
      isPublicPreview,
      selectedChannel: isPublicPreview ? selectedChannel : undefined
    };
    savePrompt(id, promptData);

    // Store the ID if this was a new policy
    if (!savedPolicyId) {
      setSavedPolicyId(id);
    }

    // Reset dirty state and update saved state
    setIsDirty(false);
    justSavedRef.current = true; // Skip next onStateChange from setting isDirty
    if (currentState) {
      const stateCopy = JSON.parse(JSON.stringify(currentState));
      setSavedTemplateState(stateCopy);
      savedTemplateStateRef.current = stateCopy; // Update ref immediately
    }

    setStatus('Active');
    setShowPublishConfirm(false);
    // Show success banner instead of navigating away
    setShowPublishBanner(true);
  };

  const handlePublishCancel = () => {
    setShowPublishConfirm(false);
    // For published playbooks, revert to last saved state
    if (status === 'Active' && savedTemplateState) {
      setTemplateState(JSON.parse(JSON.stringify(savedTemplateState)));
      setIsDirty(false);
      // Force remount of editor to load reverted state
      setEditorKey(prev => prev + 1);
    }
  };

  const handleBack = () => {
    // Warn about unsaved changes for both draft and published playbooks
    if (isDirty) {
      setPendingNavigation(basePath);
      setShowUnsavedWarning(true);
    } else {
      navigate(basePath);
    }
  };

  const handlePageTabChange = (tab: 'home' | 'playbook') => {
    const targetPath = tab === 'home' ? basePath : `${basePath}/playbook`;
    // Warn about unsaved changes for both draft and published playbooks
    if (isDirty) {
      setPendingNavigation(targetPath);
      setShowUnsavedWarning(true);
    } else {
      setActivePageTab(tab);
      navigate(targetPath);
    }
  };

  // Handle unsaved changes warning - Save (or Save & publish for Active) and stay
  const handleSaveAndStay = () => {
    if (status === 'Active') {
      // For published playbooks, do Save & publish
      handlePublishConfirm();
    } else {
      // For draft/new playbooks, just save (shows success banner)
      performSave();
    }
    // Close warning dialog and stay on page
    setShowUnsavedWarning(false);
    setPendingNavigation(null);
  };

  // Handle unsaved changes warning - Discard changes
  const handleDiscardChanges = () => {
    setShowUnsavedWarning(false);
    setIsDirty(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  // Only check for template when creating new policies
  if (!isEditMode && !template) {
    return (
      <main className="main-content">
        <div className="error-message">Prompt template not found</div>
      </main>
    );
  }

  // Render profile display based on selection mode
  const renderProfileDisplay = () => {
    if (selectionMode === 'all') {
      return (
        <div className="profile-display-text">{isPublicPreview ? `All ${selectedChannel} queues` : 'All Engagement profiles'}</div>
      );
    } else if (selectionMode === 'list' && selectedProfiles.length > 0) {
      return (
        <div className="profile-list-display">
          {selectedProfiles.map(profile => (
            <div key={profile.profileId} className="profile-list-item">
              <div className="profile-info-group">
                {isPublicPreview ? (
                  <span className="profile-list-name">{profile.profileName}</span>
                ) : (
                  <>
                    <span className="profile-list-name">{profile.profileName}</span>
                    <span className="profile-list-queues">({profile.queues.join(', ')})</span>
                  </>
                )}
              </div>
              <button
                className="profile-list-remove"
                onClick={() => handleRemoveProfile(profile.profileId)}
                aria-label={isPublicPreview ? "Remove queue" : "Remove profile"}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      );
    } else if (selectionMode === 'except' && selectedProfiles.length > 0) {
      return (
        <div className="profile-except-display">
          <div className="profile-display-text">{isPublicPreview ? `All ${selectedChannel} queues except:` : 'All engagement profiles except:'}</div>
          <div className="profile-list-display">
            {selectedProfiles.map(profile => (
              <div key={profile.profileId} className="profile-list-item">
                <div className="profile-info-group">
                  {isPublicPreview ? (
                    <span className="profile-list-name">{profile.profileName}</span>
                  ) : (
                    <>
                      <span className="profile-list-name">{profile.profileName}</span>
                      <span className="profile-list-queues">({profile.queues.join(', ')})</span>
                    </>
                  )}
                </div>
                <button
                  className="profile-list-remove"
                  onClick={() => handleRemoveProfile(profile.profileId)}
                  aria-label={isPublicPreview ? "Remove queue" : "Remove profile"}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="profile-display-text">{isPublicPreview ? 'No queues selected' : 'No profiles selected'}</div>
    );
  };

  // Render the main form content (used in both normal and copilot layouts)
  const renderFormContent = (inCopilotMode: boolean = false) => (
    <>
      {/* Header */}
      <div className="prompt-header-section">
        <div className="header-title-group">
          <h1 className="prompt-page-title">{inCopilotMode ? promptName || 'Assignment Policy' : 'Orchestration Agent (Preview)'}</h1>
          {!inCopilotMode && <span className="preview-badge-header">Preview</span>}
        </div>
        {!inCopilotMode && (
          <p className="prompt-page-subtitle">
            Create and manage routing scenario prompts. Define intelligent routing logic, assignment rules, and automated actions.
          </p>
        )}
      </div>

      {/* Playbook Name - only show in non-copilot mode */}
      {!inCopilotMode && (
        <div className="prompt-name-section">
          <label className="prompt-name-label">Playbook Name</label>
          <input
            type="text"
            className="prompt-name-input"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
            placeholder="Enter playbook name"
          />
        </div>
      )}

      {/* Profiles/Queues Section - Card */}
      <div className="edit-card">
        <div className="profile-section-full">
          <div className="profile-section-header">
            <div className="profile-section-header-left">
              <h2 className="profile-section-title">{isPublicPreview ? 'Queues' : 'Profiles'}</h2>
              <button className="profile-edit-link" onClick={handleAddProfile}>
                Edit
              </button>
            </div>
            {isPublicPreview && (
              <div className="channel-display-row">
                <span className="channel-label">Channel:</span>
                <span className="channel-value">{selectedChannel}</span>
              </div>
            )}
          </div>
          <div className="profile-display-box">
            {renderProfileDisplay()}
          </div>
        </div>
      </div>

      {/* Edit Mode Toggle - REMOVED, now always showing template-based editor */}

      {/* Policy Behavior Card */}
      <div className="edit-card">
        {/* Policy Behavior Header and Trigger/Status Row */}
        <div className="behavior-trigger-row">
          {/* Playbook Behavior Title and Description - Left */}
          <div className="policy-behavior-header">
            <h2 className="policy-behavior-title">{inCopilotMode ? 'Generated Playbook' : 'Describe Playbook Behavior'}</h2>
            <p className="policy-behavior-desc">
              {inCopilotMode
                ? 'This playbook was generated by Copilot based on your conversation.'
                : 'Use natural language to describe what this playbook should do. Be specific about conditions and actions.'
              }
            </p>
          </div>

          {/* Trigger and Status - Right */}
          <div className="trigger-status-section-right">
            <div className="field-group">
              <label className="field-label-small">Trigger Event</label>
              {/* Show plain text for all template-based scenarios */}
              {(promptType === 'wait-time-escalation' || savedScenarioId === 'wait-time-escalation') ? (
                <div className="trigger-text-display">Conversation is waiting in the queue</div>
              ) : (promptType === 'queue-transfer-escalation' || savedScenarioId === 'queue-transfer-escalation') ? (
                <div className="trigger-text-display">Conversation is transferred to the queue</div>
              ) : (promptType === 'overflow-conditions-actions' || savedScenarioId === 'overflow-conditions-actions' || isPublicPreview) ? (
                <div className="trigger-text-display">Conversation is waiting in queue</div>
              ) : (
                <select
                  className="field-select"
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                >
                  {triggerEvents.map(trigger => (
                    <option key={trigger.id} value={trigger.id}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="field-group">
              <label className="field-label-small">Status</label>
              <div className={`status-badge ${status.toLowerCase()}`}>
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Template Based Editor - Always shown (no edit mode toggle) */}
        {!inCopilotMode && (
          <div className="policy-behavior-builder-section template-full-width">
            <TemplateBasedEditor
              key={editorKey}
              initialRequirement={nlRequirement}
              scenarioId={promptType || savedScenarioId || urlScenario || undefined}
              initialState={templateState}
              isPublicPreview={isPublicPreview}
              triggerValidation={triggerValidation}
              onValidationResult={handleValidationResult}
              onStateChange={(state: TemplateEditorState | ExpertRoutingEditorState, prompt: string) => {
                // Update local state and ref for persistence
                setTemplateState(state as TemplateEditorState);
                currentTemplateStateRef.current = state as TemplateEditorState; // Always keep ref in sync
                setPolicyBehavior(prompt);

                // For new playbooks on initial load, save the state as baseline
                if (isInitialLoadRef.current) {
                  isInitialLoadRef.current = false;
                  const stateCopy = JSON.parse(JSON.stringify(state));
                  setSavedTemplateState(stateCopy);
                  savedTemplateStateRef.current = stateCopy; // Update ref immediately
                  return; // Don't set isDirty on initial load
                }

                // Skip setting isDirty immediately after save
                if (justSavedRef.current) {
                  justSavedRef.current = false;
                  return;
                }

                // Compare with saved state (using ref for synchronous access)
                const currentStateJson = JSON.stringify(state);
                const savedStateJson = savedTemplateStateRef.current ? JSON.stringify(savedTemplateStateRef.current) : null;

                if (currentStateJson !== savedStateJson) {
                  setIsDirty(true);
                  // Clear validation warnings when user makes changes
                  if (hasValidationWarnings) {
                    setHasValidationWarnings(false);
                  }
                }
              }}
              onPromptGenerated={(prompt: string, config: PolicyConfig) => {
                setPolicyBehavior(prompt);
                setPolicyConfig(config);

                // Save the policy and navigate to Playbook
                // Use savedPolicyId if available (existing policy or already saved)
                const id = savedPolicyId || `template-${Date.now()}`;
                const effectiveScenarioId = promptType || savedScenarioId || urlScenario || undefined;
                const promptData = {
                  id,
                  promptName: promptName || 'Template-based Policy',
                  policyBehavior: prompt,
                  selectedProfiles,
                  selectionMode,
                  selectedTrigger,
                  status: 'Draft' as const,
                  lastModified: 'Just now',
                  type: policyType,
                  templateState,
                  scenarioId: effectiveScenarioId,
                  isPublicPreview,
                  selectedChannel: isPublicPreview ? selectedChannel : undefined
                };
                savePrompt(id, promptData);

                // Store the ID if this was a new policy
                if (!savedPolicyId) {
                  setSavedPolicyId(id);
                }

                navigate(`${basePath}/playbook`);
              }}
            />
          </div>
        )}
        {inCopilotMode && (
          /* Editable Policy Display for Copilot Mode */
          <div className="policy-behavior-textarea-section">
            {policyBehavior && (
              <div className="copilot-generated-badge-inline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
                Generated by Copilot
              </div>
            )}
            {policyConfig ? (
              <EditablePolicyDisplay
                config={policyConfig}
                onConfigChange={(newConfig) => {
                  setPolicyConfig(newConfig);
                  // Regenerate prompt from updated config
                  const newPrompt = generatePromptFromConfig(newConfig);
                  setPolicyBehavior(newPrompt);
                }}
              />
            ) : (
              <div className="copilot-waiting-message">
                <p>Use the Copilot chat on the left to describe your routing requirements. The generated policy will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`agcd-prompt-edit-page ${editMode === 'copilot' ? 'copilot-layout' : ''}`}>
      {/* Success Banners */}
      {showSaveBanner && (
        <div className="success-banner">
          <div className="success-banner-content">
            <svg className="success-banner-icon" width="16" height="16" viewBox="0 0 16 16" fill="#107c10">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.854 6.354l-4.5 4.5a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7 9.793l4.146-4.147a.5.5 0 0 1 .708.708z"/>
            </svg>
            <span className="success-banner-text">
              Playbook saved successfully!{' '}
              <a href="#" className="success-banner-link" onClick={(e) => { e.preventDefault(); navigate(`${basePath}/playbook`); }}>
                Back to Playbook page
              </a>
            </span>
          </div>
          <button className="success-banner-close" onClick={() => setShowSaveBanner(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
      {showPublishBanner && (
        <div className="success-banner">
          <div className="success-banner-content">
            <svg className="success-banner-icon" width="16" height="16" viewBox="0 0 16 16" fill="#107c10">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.854 6.354l-4.5 4.5a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7 9.793l4.146-4.147a.5.5 0 0 1 .708.708z"/>
            </svg>
            <span className="success-banner-text">
              Playbook published successfully!{' '}
              <a href="#" className="success-banner-link" onClick={(e) => { e.preventDefault(); navigate(`${basePath}/playbook`); }}>
                Back to Playbook page
              </a>
            </span>
          </div>
          <button className="success-banner-close" onClick={() => setShowPublishBanner(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Top Menu Bar */}
      <div className="top-menu-bar">
        <div className="menu-left-actions">
          <button className="menu-back-button" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 2l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button
            className={`menu-btn-secondary ${status === 'Active' ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={status === 'Active'}
            title={
              status === 'Active'
                ? 'Save is disabled for a published policy as it will change the playbook state from Active to Draft. Do Save & publish once the playbook is updated'
                : ''
            }
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-13zM3.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-9z"/>
              <path d="M11 3H5v4h6V3zM5 2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H5z"/>
            </svg>
            Save
          </button>
          <button
            className={`menu-btn-primary ${hasValidationWarnings ? 'disabled' : ''}`}
            onClick={handlePublishClick}
            disabled={hasValidationWarnings}
            title={hasValidationWarnings ? 'Resolve the warnings before you can publish the playbook' : ''}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.695 8.695 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.75.75 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75zM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5zM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75z"/>
            </svg>
            {status === 'Active' ? 'Save & publish' : 'Publish'}
          </button>
          {editMode === 'copilot' && (
            <button className="menu-btn-exit-copilot" onClick={() => setEditMode('simple')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Exit Copilot
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher - hide in copilot mode */}
      {editMode !== 'copilot' && (
        <div className="agcd-tab-switcher-container">
          <div className="agcd-tab-switcher">
            <button
              className={`agcd-tab-button ${activePageTab === 'home' ? 'active' : ''}`}
              onClick={() => handlePageTabChange('home')}
            >
              Home
            </button>
            <button
              className={`agcd-tab-button ${activePageTab === 'playbook' ? 'active' : ''}`}
              onClick={() => handlePageTabChange('playbook')}
            >
              Playbook
            </button>
          </div>
        </div>
      )}

      {/* Copilot Split Layout */}
      {editMode === 'copilot' ? (
        <div className="copilot-split-container">
          {/* Left Panel - Copilot Chat */}
          <div className="copilot-left-panel">
            <CopilotPromptEditor
              scenario={promptName || 'Assignment Policy'}
              onPromptGenerated={(prompt) => setPolicyBehavior(prompt)}
              onPolicyConfigChange={(config) => setPolicyConfig(config)}
            />
          </div>

          {/* Right Panel - Form Content */}
          <div className="copilot-right-panel">
            <main className="main-content prompt-edit-container-new copilot-form-content">
              {renderFormContent(true)}
            </main>
          </div>
        </div>
      ) : (
        <main className="main-content prompt-edit-container-new">
          {renderFormContent(false)}
        </main>
      )}

      {/* Side Panel for Profile Selection */}
      {showSidePanel && (
        <>
          <div className="side-panel-overlay" onClick={handleCancelProfiles}></div>
          <div className="side-panel-drawer">
            <div className="side-panel-header">
              <h2 className="side-panel-title">{isPublicPreview ? 'Queues' : 'Profiles'}</h2>
              <button className="side-panel-close-btn" onClick={handleCancelProfiles}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tab Header - Only show for non-public preview */}
            {!isPublicPreview && (
              <div className="side-panel-tabs">
                <button
                  className="side-panel-tab active"
                >
                  Engagement profile
                </button>
              </div>
            )}

            <div className="side-panel-content">
                  <p className="side-panel-description">
                    {isPublicPreview
                      ? 'Select how you want to apply this playbook to queues.'
                      : 'Select how you want to apply this playbook to engagement profiles.'
                    }
                  </p>

                  {/* Channel Selection - Only for public preview */}
                  {isPublicPreview && (
                    <div className="channel-selection-group">
                      <label className="channel-select-label">Channel</label>
                      <select
                        className="channel-select-dropdown"
                        value={tempSelectedChannel}
                        onChange={(e) => {
                          setTempSelectedChannel(e.target.value as ChannelType);
                          // Clear selected queues when channel changes
                          setTempSelectedProfiles([]);
                        }}
                      >
                        <option value="Voice">Voice</option>
                        <option value="Messaging">Messaging</option>
                      </select>
                    </div>
                  )}

                  {/* Selection Mode Radio Buttons */}
                  <div className="selection-mode-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="selectionMode"
                        value="all"
                        checked={tempSelectionMode === 'all'}
                        onChange={() => setTempSelectionMode('all')}
                      />
                      <span className="radio-label">{isPublicPreview ? `All ${tempSelectedChannel} queues` : 'All Engagement profiles'}</span>
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        name="selectionMode"
                        value="list"
                        checked={tempSelectionMode === 'list'}
                        onChange={() => setTempSelectionMode('list')}
                      />
                      <span className="radio-label">{isPublicPreview ? `List of ${tempSelectedChannel} queues` : 'List of engagement profiles'}</span>
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        name="selectionMode"
                        value="except"
                        checked={tempSelectionMode === 'except'}
                        onChange={() => setTempSelectionMode('except')}
                      />
                      <span className="radio-label">{isPublicPreview ? `All ${tempSelectedChannel} queues except` : 'All engagement profiles except'}</span>
                    </label>
                  </div>

                  {/* Profile/Queue List (shown for 'list' and 'except' modes) */}
                  {(tempSelectionMode === 'list' || tempSelectionMode === 'except') && (
                    <div className="profiles-table-container">
                      {isPublicPreview ? (
                        /* Public Preview - Show only Queues filtered by channel */
                        <table className="profiles-selection-table">
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}></th>
                              <th>Queue</th>
                              <th>Channel</th>
                            </tr>
                          </thead>
                          <tbody>
                            {queueProfileMappings
                              .filter(queue => queue.channel === tempSelectedChannel)
                              .map(queue => (
                              <tr key={queue.queueId}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={tempSelectedProfiles.includes(queue.queueId)}
                                    onChange={() => handleProfileCheckbox(queue.queueId)}
                                    className="profile-checkbox-input"
                                  />
                                </td>
                                <td className="queue-names-cell">{queue.queueName}</td>
                                <td className="channel-cell">{queue.channel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        /* Regular flow - Show Engagement Profiles with Queue Names */
                        <table className="profiles-selection-table">
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}></th>
                              <th>Engagement Profile</th>
                              <th>Queue Names</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profilesWithQueues.map(profile => (
                              <tr key={profile.profileId}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={tempSelectedProfiles.includes(profile.profileId)}
                                    onChange={() => handleProfileCheckbox(profile.profileId)}
                                    className="profile-checkbox-input"
                                  />
                                </td>
                                <td className="profile-name-cell">
                                  <Link
                                    to={`/engagement-profile/${profile.profileId}`}
                                    className="profile-name-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {profile.profileName}
                                  </Link>
                                </td>
                                <td className="queue-names-cell">{profile.queues.join(', ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
            </div>

            <div className="side-panel-footer">
              <button className="btn-secondary-action" onClick={handleCancelProfiles}>
                Cancel
              </button>
              <button className="btn-primary-action" onClick={handleSaveProfiles}>
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <>
          <div className="publish-confirm-overlay" onClick={handlePublishCancel}></div>
          <div className="publish-confirm-modal">
            <div className="publish-confirm-header">
              <h2 className="publish-confirm-title">
                {status === 'Active' ? 'Update Playbook' : 'Publish Playbook'}
              </h2>
              <button className="publish-confirm-close" onClick={handlePublishCancel}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="publish-confirm-content">
              {status === 'Active' ? (
                <>
                  <p className="publish-confirm-message">
                    If you do Save & publish, the playbook will get updated and published with the latest changes and the conversations will be routed as per this updated playbook for the selected queues.
                  </p>
                  <p className="publish-confirm-warning">
                    <svg className="warning-icon" width="16" height="16" viewBox="0 0 16 16" fill="#d83b01">
                      <path d="M8 1L1 14h14L8 1zm0 4v4m0 2v1"/>
                      <path d="M8 1L1 14h14L8 1z" fill="none" stroke="#d83b01" strokeWidth="1"/>
                      <circle cx="8" cy="11" r="0.75" fill="#d83b01"/>
                      <rect x="7.25" y="5" width="1.5" height="4" rx="0.5" fill="#d83b01"/>
                    </svg>
                    If you Cancel, then the latest changes will be lost and the playbook will be reverted to the last published version.
                  </p>
                </>
              ) : (
                <p className="publish-confirm-message">
                  This will make the playbook active and the conversations will be routed as per this playbook for the selected queues.
                </p>
              )}
            </div>
            <div className="publish-confirm-footer">
              <button className="btn-secondary-action" onClick={handlePublishCancel}>
                Cancel
              </button>
              <button className="btn-primary-action" onClick={handlePublishConfirm}>
                {status === 'Active' ? 'Save & publish' : 'Publish'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <>
          <div className="publish-confirm-overlay"></div>
          <div className="publish-confirm-modal">
            <div className="publish-confirm-header">
              <h2 className="publish-confirm-title">Unsaved Changes</h2>
            </div>
            <div className="publish-confirm-content">
              <p className="publish-confirm-message">
                {status === 'Active'
                  ? 'You have unsaved changes. Do you want to save and publish them before leaving?'
                  : 'You have unsaved changes. Do you want to save them before leaving?'
                }
              </p>
            </div>
            <div className="publish-confirm-footer">
              <button className="btn-secondary-action" onClick={handleDiscardChanges}>
                Discard changes
              </button>
              <button className="btn-primary-action" onClick={handleSaveAndStay}>
                {status === 'Active' ? 'Save & publish' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgCDPromptEdit;
