import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './AgCDPromptEdit.css';
import { savePrompt, getPrompt, SelectionMode } from '../utils/promptStorage';
import TemplatePromptEditor from './TemplatePromptEditor';
import CopilotPromptEditor from './CopilotPromptEditor';

// Engagement profiles data
const engagementProfiles = [
  { id: 'profile1', name: 'Standard Support Profile' },
  { id: 'profile2', name: 'VIP Customer Profile' },
  { id: 'profile3', name: 'Technical Support Profile' },
  { id: 'profile4', name: 'Sales Team Profile' },
  { id: 'profile5', name: 'After-Hours Profile' },
  { id: 'profile6', name: 'Billing Support Profile' }
];

// Queue to profile mappings
const queueProfileMappings = [
  { queueId: 'q1', queueName: 'General Support Queue', profileId: 'profile1', profileName: 'Standard Support Profile' },
  { queueId: 'q2', queueName: 'VIP Support Queue', profileId: 'profile2', profileName: 'VIP Customer Profile' },
  { queueId: 'q3', queueName: 'Technical Support Queue', profileId: 'profile3', profileName: 'Technical Support Profile' },
  { queueId: 'q4', queueName: 'Sales Queue', profileId: 'profile4', profileName: 'Sales Team Profile' },
  { queueId: 'q5', queueName: 'Billing Queue', profileId: 'profile6', profileName: 'Billing Support Profile' },
  { queueId: 'q6', queueName: 'Chat Support Queue', profileId: 'profile1', profileName: 'Standard Support Profile' },
  { queueId: 'q7', queueName: 'Live Chat Queue', profileId: 'profile1', profileName: 'Standard Support Profile' },
  { queueId: 'q8', queueName: 'Case Management Queue', profileId: 'profile1', profileName: 'Standard Support Profile' },
  { queueId: 'q9', queueName: 'Emergency Queue', profileId: 'profile2', profileName: 'VIP Customer Profile' },
  { queueId: 'q10', queueName: 'After Hours Queue', profileId: 'profile5', profileName: 'After-Hours Profile' },
];

// Trigger events
const triggerEvents = [
  { id: 'conversation-waiting', label: 'Conversation is waiting in queue' },
  { id: 'conversation-transferred', label: 'Conversation is transferred' }
];

// Prompt templates
const promptTemplates: { [key: string]: { title: string; type: string; description: string; defaultPrompt: string } } = {
  // Orchestration prompts
  'wait-time-escalation': {
    title: 'Escalate priority based on wait time',
    type: 'Orchestrator',
    description: 'Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.',
    defaultPrompt: 'Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.'
  },
  'queue-transfer-escalation': {
    title: 'Escalate priority based on transfer to a queue',
    type: 'Orchestrator',
    description: 'Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.',
    defaultPrompt: 'Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.'
  },
  'scheduled-callback-overflow': {
    title: 'Configure scheduled callback as overflow action',
    type: 'Orchestrator',
    description: 'When queue capacity is reached, automatically offer customers the option to schedule a callback at their convenience.',
    defaultPrompt: 'When queue capacity is reached, automatically offer customers the option to schedule a callback at their convenience.'
  },
  'did-overflow': {
    title: 'Overflow for Direct Inward Dialing',
    type: 'Orchestrator',
    description: 'Route incoming DID calls to alternative queues or agents when primary resources are unavailable.',
    defaultPrompt: 'Route incoming DID calls to alternative queues or agents when primary resources are unavailable.'
  },
  'agent-availability-overflow': {
    title: 'Immediate overflow based on agent availability',
    type: 'Orchestrator',
    description: 'Instantly redirect conversations to overflow queues when no agents are available in the primary queue.',
    defaultPrompt: 'Instantly redirect conversations to overflow queues when no agents are available in the primary queue.'
  },
  'offline-overflow': {
    title: 'Immediate overflow when all agents are offline',
    type: 'Orchestrator',
    description: 'Automatically route conversations when all agents in a queue are offline or unavailable.',
    defaultPrompt: 'Automatically route conversations when all agents in a queue are offline or unavailable.'
  },
  'recurring-overflow': {
    title: 'Recurring overflow actions',
    type: 'Orchestrator',
    description: 'Set up repeating overflow actions based on time patterns or recurring queue conditions.',
    defaultPrompt: 'Set up repeating overflow actions based on time patterns or recurring queue conditions.'
  },
  'messages-with-overflow': {
    title: 'Combine frequent messages with overflow actions',
    type: 'Orchestrator',
    description: 'Send periodic status updates to customers while implementing overflow routing strategies.',
    defaultPrompt: 'Send periodic status updates to customers while implementing overflow routing strategies.'
  },
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

const AgCDPromptEdit: React.FC = () => {
  const { promptType, policyId } = useParams<{ promptType?: string; policyId?: string }>();
  const navigate = useNavigate();

  // Determine if we're editing an existing policy or creating a new one
  const isEditMode = !!policyId;
  const currentId = policyId || promptType || '';
  const template = promptType ? promptTemplates[promptType] : null;

  const [promptName, setPromptName] = useState('');
  const [policyBehavior, setPolicyBehavior] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileWithQueues[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all');
  const [selectedTrigger, setSelectedTrigger] = useState('conversation-waiting');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [policyType, setPolicyType] = useState<string>('Orchestrator');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [tempSelectionMode, setTempSelectionMode] = useState<SelectionMode>('all');
  const [tempSelectedProfiles, setTempSelectedProfiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'engagement' | 'conversation'>('engagement');
  const [activePageTab, setActivePageTab] = useState<'home' | 'playbook'>('home');
  const [editMode, setEditMode] = useState<'simple' | 'builder' | 'copilot'>('simple');

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
        setSelectedTrigger(savedPrompt.selectedTrigger);
        setStatus(savedPrompt.status);
        setPolicyType(savedPrompt.type);
      }
    } else if (template) {
      // Creating new policy from template - use template defaults
      setPromptName(template.title);
      setPolicyBehavior(template.defaultPrompt);
      setSelectedProfiles([]);
      setSelectionMode('all');
      setSelectedTrigger('conversation-waiting');
      setStatus('Draft');
      setPolicyType(template.type);
    }
  }, [currentId, template, isEditMode]);

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

    if (tempSelectionMode === 'all') {
      setSelectedProfiles([]);
    } else {
      const newSelectedProfiles = tempSelectedProfiles.map(profileId => {
        const profile = profilesWithQueues.find(p => p.profileId === profileId);
        return profile!;
      });
      setSelectedProfiles(newSelectedProfiles);
    }
    setShowSidePanel(false);
  };

  const handleCancelProfiles = () => {
    setShowSidePanel(false);
    setTempSelectedProfiles([]);
    setTempSelectionMode(selectionMode);
  };

  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles(prev => prev.filter(p => p.profileId !== profileId));
  };

  const handleSave = () => {
    // Generate unique ID for new policies, use existing ID for edits
    const id = isEditMode ? currentId : `${promptType}-${Date.now()}`;

    const promptData = {
      id,
      promptName,
      policyBehavior,
      selectedProfiles,
      selectionMode,
      selectedTrigger,
      status,
      lastModified: 'Just now',
      type: policyType
    };
    savePrompt(id, promptData);
    alert('Policy saved successfully!');

    // If creating new policy, navigate to edit mode with the new ID
    if (!isEditMode) {
      navigate(`/agcd/policy/${id}`, { replace: true });
    }
  };

  const handlePublish = () => {
    // Generate unique ID for new policies, use existing ID for edits
    const id = isEditMode ? currentId : `${promptType}-${Date.now()}`;

    const promptData = {
      id,
      promptName,
      policyBehavior,
      selectedProfiles,
      selectionMode,
      selectedTrigger,
      status: 'Published' as const,
      lastModified: 'Just now',
      type: policyType
    };
    savePrompt(id, promptData);
    setStatus('Published');
    alert('Policy published successfully!');
    navigate('/agcd/playbook');
  };

  const handleBack = () => {
    navigate('/agcd');
  };

  const handlePageTabChange = (tab: 'home' | 'playbook') => {
    setActivePageTab(tab);
    if (tab === 'home') {
      navigate('/agcd');
    } else {
      navigate('/agcd/playbook');
    }
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
      return <div className="profile-display-text">All Engagement profiles</div>;
    } else if (selectionMode === 'list' && selectedProfiles.length > 0) {
      return (
        <div className="profile-list-display">
          {selectedProfiles.map(profile => (
            <div key={profile.profileId} className="profile-list-item">
              <div className="profile-info-group">
                <span className="profile-list-name">{profile.profileName}</span>
                <span className="profile-list-queues">({profile.queues.join(', ')})</span>
              </div>
              <button
                className="profile-list-remove"
                onClick={() => handleRemoveProfile(profile.profileId)}
                aria-label="Remove profile"
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
          <div className="profile-display-text">All engagement profiles except:</div>
          <div className="profile-list-display">
            {selectedProfiles.map(profile => (
              <div key={profile.profileId} className="profile-list-item">
                <div className="profile-info-group">
                  <span className="profile-list-name">{profile.profileName}</span>
                  <span className="profile-list-queues">({profile.queues.join(', ')})</span>
                </div>
                <button
                  className="profile-list-remove"
                  onClick={() => handleRemoveProfile(profile.profileId)}
                  aria-label="Remove profile"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <div className="profile-display-text">No profiles selected</div>;
  };

  return (
    <div className="agcd-prompt-edit-page">
      {/* Top Menu Bar */}
      <div className="top-menu-bar">
        <div className="menu-left-actions">
          <button className="menu-back-button" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 2l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button className="menu-btn-secondary" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-13zM3.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-9z"/>
              <path d="M11 3H5v4h6V3zM5 2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H5z"/>
            </svg>
            Save
          </button>
          <button className="menu-btn-primary" onClick={handlePublish}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.695 8.695 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.75.75 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75zM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5zM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75z"/>
            </svg>
            Publish
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
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

      <main className="main-content prompt-edit-container-new">
        {/* Header */}
        <div className="prompt-header-section">
          <div className="header-title-group">
            <h1 className="prompt-page-title">Orchestration Agent (Preview)</h1>
            <span className="preview-badge-header">Preview: Testing</span>
          </div>
          <p className="prompt-page-subtitle">
            Create and manage routing scenario prompts. Define intelligent routing logic, assignment rules, and automated actions.
          </p>
        </div>

        {/* Prompt Name */}
        <div className="prompt-name-section">
          <label className="prompt-name-label">Prompt Name</label>
          <input
            type="text"
            className="prompt-name-input"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
            placeholder="Enter prompt name"
          />
        </div>

        {/* Profiles Section - Card */}
        <div className="edit-card">
          <div className="profile-section-full">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Profiles</h2>
              <button className="profile-edit-link" onClick={handleAddProfile}>
                Edit
              </button>
            </div>
            <div className="profile-display-box">
              {renderProfileDisplay()}
            </div>
          </div>
        </div>

        {/* Policy Behavior Card */}
        <div className="edit-card">
          {/* Policy Behavior Header and Trigger/Status Row */}
          <div className="behavior-trigger-row">
            {/* Policy Behavior Title and Description - Left */}
            <div className="policy-behavior-header">
              <h2 className="policy-behavior-title">Describe Policy Behavior</h2>
              <p className="policy-behavior-desc">
                Use natural language to describe what this policy should do. Be specific about conditions and actions.
              </p>
            </div>

            {/* Trigger and Status - Right */}
            <div className="trigger-status-section-right">
              <div className="field-group">
                <label className="field-label-small">Trigger Event</label>
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
              </div>
              <div className="field-group">
                <label className="field-label-small">Status</label>
                <div className={`status-badge ${status.toLowerCase()}`}>
                  {status}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Toggle */}
          <div className="edit-mode-toggle">
            <span className="edit-mode-label">Edit Mode:</span>
            <div className="toggle-button-group">
              <button
                className={`toggle-btn ${editMode === 'simple' ? 'active' : ''}`}
                onClick={() => setEditMode('simple')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 2A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 2h-11zM2 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-9z"/>
                  <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                </svg>
                Simple Text
              </button>
              <button
                className={`toggle-btn ${editMode === 'builder' ? 'active' : ''}`}
                onClick={() => setEditMode('builder')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                  <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/>
                  <path d="M10.5 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                </svg>
                Configurable Builder
              </button>
              <button
                className={`toggle-btn toggle-btn-copilot ${editMode === 'copilot' ? 'active' : ''}`}
                onClick={() => setEditMode('copilot')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Copilot
              </button>
            </div>
          </div>

          {/* Conditional rendering based on edit mode */}
          {editMode === 'simple' && (
            /* Policy Behavior Textarea - Full Width */
            <div className="policy-behavior-textarea-section">
              <textarea
                className="policy-behavior-textarea"
                value={policyBehavior}
                onChange={(e) => setPolicyBehavior(e.target.value)}
                rows={8}
              />
              <div className="policy-behavior-hint-text">
                Only describe condition and actions. Do not mention queues or profiles in this section
              </div>
            </div>
          )}
          {editMode === 'builder' && (
            /* Template Prompt Editor */
            <div className="policy-behavior-builder-section">
              <TemplatePromptEditor
                onPromptChange={(prompt) => setPolicyBehavior(prompt)}
              />
            </div>
          )}
          {editMode === 'copilot' && (
            /* Copilot Prompt Editor */
            <div className="policy-behavior-copilot-section">
              <CopilotPromptEditor
                scenario={promptName || 'Assignment Policy'}
                onPromptGenerated={(prompt) => setPolicyBehavior(prompt)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Side Panel for Profile Selection */}
      {showSidePanel && (
        <>
          <div className="side-panel-overlay" onClick={handleCancelProfiles}></div>
          <div className="side-panel-drawer">
            <div className="side-panel-header">
              <h2 className="side-panel-title">Profiles</h2>
              <button className="side-panel-close-btn" onClick={handleCancelProfiles}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="side-panel-tabs">
              <button
                className={`side-panel-tab ${activeTab === 'engagement' ? 'active' : ''}`}
                onClick={() => setActiveTab('engagement')}
              >
                Engagement profile
              </button>
              <button
                className={`side-panel-tab ${activeTab === 'conversation' ? 'active' : ''}`}
                onClick={() => setActiveTab('conversation')}
              >
                Conversation flow
              </button>
            </div>

            <div className="side-panel-content">
              {activeTab === 'engagement' ? (
                <>
                  <p className="side-panel-description">
                    Select how you want to apply this policy to engagement profiles.
                  </p>

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
                      <span className="radio-label">All Engagement profiles</span>
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        name="selectionMode"
                        value="list"
                        checked={tempSelectionMode === 'list'}
                        onChange={() => setTempSelectionMode('list')}
                      />
                      <span className="radio-label">List of engagement profiles</span>
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        name="selectionMode"
                        value="except"
                        checked={tempSelectionMode === 'except'}
                        onChange={() => setTempSelectionMode('except')}
                      />
                      <span className="radio-label">All engagement profiles except</span>
                    </label>
                  </div>

                  {/* Profile List (shown for 'list' and 'except' modes) */}
                  {(tempSelectionMode === 'list' || tempSelectionMode === 'except') && (
                    <div className="profiles-table-container">
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
                    </div>
                  )}
                </>
              ) : (
                <div className="conversation-flow-placeholder">
                  <p>Conversation flow configuration will be available here.</p>
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
    </div>
  );
};

export default AgCDPromptEdit;
