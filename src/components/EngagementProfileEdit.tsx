import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VoiceChannelEdit.css';
import { getAllPrompts, PromptData } from '../utils/promptStorage';

// Map profile IDs to names
const profileNames: { [key: string]: string } = {
  'profile1': 'Standard Support Profile',
  'profile2': 'VIP Customer Profile',
  'profile3': 'Technical Support Profile',
  'profile4': 'Sales Team Profile',
  'profile5': 'After-Hours Profile',
  'profile6': 'Billing Support Profile'
};

// Helper function to determine which tab a playbook belongs to
const getPlaybookTab = (prompt: PromptData): string => {
  const name = prompt.promptName.toLowerCase();

  if (name.includes('overflow')) {
    return 'overflow';
  } else if (name.includes('automated') || name.includes('message')) {
    return 'automatedMessages';
  } else if (name.includes('priorit')) {
    return 'dynamicPrioritization';
  } else if (name.includes('assignment') || name.includes('vip') || name.includes('expert') || name.includes('callback')) {
    return 'assignmentMethod';
  }

  // Default based on type
  if (prompt.type === 'Assignment') {
    return 'assignmentMethod';
  }
  return 'overflow'; // Default for Orchestrator type
};

const EngagementProfileEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('automatedMessages');
  const [consultEnabled, setConsultEnabled] = useState(true);
  const [transferEnabled, setTransferEnabled] = useState(true);
  const [allPlaybooks, setAllPlaybooks] = useState<PromptData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const profileName = id ? profileNames[id] || 'Unknown Profile' : 'Unknown Profile';

  // Load playbooks on mount
  useEffect(() => {
    const prompts = getAllPrompts();
    setAllPlaybooks(prompts);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Get playbooks for current profile and tab
  const getPlaybooksForTab = (tab: string): PromptData[] => {
    return allPlaybooks.filter(playbook => {
      // Check if playbook belongs to this tab
      if (getPlaybookTab(playbook) !== tab) return false;

      // Check if playbook is associated with this profile
      if (playbook.selectionMode === 'all') return true;

      if (playbook.selectionMode === 'list') {
        return playbook.selectedProfiles.some(p => p.profileId === id);
      }

      if (playbook.selectionMode === 'except') {
        return !playbook.selectedProfiles.some(p => p.profileId === id);
      }

      return false;
    });
  };

  const handleEditPlaybook = (policyId: string) => {
    navigate(`/agcd/policy/${policyId}`);
  };

  const toggleMenu = (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === policyId ? null : policyId);
  };

  // Component to render AgCD playbooks section
  const renderAgCDSection = (tabName: string, filterTab: 'orchestration' | 'assignment', scenario: string, tabKey: string) => {
    const playbooks = getPlaybooksForTab(tabKey);

    return (
      <div className="agcd-section-card">
        {/* AgCD Section Header */}
        <h3 className="agcd-section-header">Agentic Conversation Distribution</h3>

        {/* AgCD Integration Banner */}
        <div className="agcd-integration-banner">
          <p className="agcd-integration-text">
            Configure {tabName} using natural language playbooks via Agentic Conversation Distribution (AgCD)
          </p>
          <button
            className="agcd-integration-cta"
            onClick={() => navigate(`/agcd?openGallery=true&tab=${filterTab}&scenario=${scenario}`)}
          >
            Configure with AgCD
          </button>
        </div>

        {/* Playbooks Table */}
        {playbooks.length > 0 && (
          <div className="agcd-playbooks-section">
            <div className="agcd-playbooks-header">
              <h3 className="agcd-playbooks-title">Playbooks already configured:</h3>
              <button
                className="view-playbook-page-btn"
                onClick={() => navigate('/agcd/playbook')}
              >
                View all playbooks →
              </button>
            </div>

            <div className="agcd-playbooks-table-wrapper">
              <table className="agcd-playbooks-table">
                <thead>
                  <tr>
                    <th>Policy Name</th>
                    <th>Trigger</th>
                    <th>Status</th>
                    <th>Last Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {playbooks.map((policy) => (
                    <tr key={policy.id}>
                      <td>
                        <span
                          className="policy-name-link-text"
                          onClick={() => handleEditPlaybook(policy.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {policy.promptName}
                        </span>
                      </td>
                      <td className="trigger-column-text">
                        {policy.selectedTrigger ?
                          policy.selectedTrigger.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          : 'Work item is unassigned'}
                      </td>
                      <td>
                        <span className={`status-pill ${policy.status.toLowerCase()}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td>{policy.lastModified}</td>
                      <td>
                        <div className="action-menu-container">
                          <button
                            className="action-menu-button"
                            onClick={(e) => toggleMenu(policy.id, e)}
                            title="More actions"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="8" cy="3" r="1.5"/>
                              <circle cx="8" cy="8" r="1.5"/>
                              <circle cx="8" cy="13" r="1.5"/>
                            </svg>
                          </button>
                          {openMenuId === policy.id && (
                            <div className="action-dropdown-menu">
                              <button
                                className="dropdown-menu-item"
                                onClick={() => handleEditPlaybook(policy.id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 2.987 11.574a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064l6.763-6.763z"/>
                                </svg>
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="voice-channel-edit-page">
      <main className="main-content">
        <div className="page-header-bar">
          <div className="header-bar-left">
            <button className="back-button" onClick={() => navigate('/engagement-profiles')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="save-button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zm-2 0v4H5V2h6zm1 11H4V3h1v4h6V3h1v10z" />
              </svg>
              Save and close
            </button>
          </div>
          <div className="header-bar-right">
            <a href="#" className="download-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 10l-4-4h2.5V2h3v4H12L8 10zm6 3v1H2v-1h12z" />
              </svg>
              Download configuration
            </a>
          </div>
        </div>

        <div className="page-header">
          <h1 className="edit-title">{profileName}</h1>
          <p className="edit-subtitle">Profile ID: {id}</p>
        </div>

        <div className="edit-content-layout">
          <aside className="edit-sidebar">
            <nav className="edit-tabs">
              <button
                className={`edit-tab ${activeTab === 'automatedMessages' ? 'active' : ''}`}
                onClick={() => setActiveTab('automatedMessages')}
              >
                Automated messages
              </button>
              <button
                className={`edit-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
              <button
                className={`edit-tab ${activeTab === 'workDistribution' ? 'active' : ''}`}
                onClick={() => setActiveTab('workDistribution')}
              >
                Work distribution
              </button>
              <button
                className={`edit-tab ${activeTab === 'overflow' ? 'active' : ''}`}
                onClick={() => setActiveTab('overflow')}
              >
                Overflow
              </button>
              <button
                className={`edit-tab ${activeTab === 'dynamicPrioritization' ? 'active' : ''}`}
                onClick={() => setActiveTab('dynamicPrioritization')}
              >
                Dynamic prioritization
              </button>
              <button
                className={`edit-tab ${activeTab === 'assignmentMethod' ? 'active' : ''}`}
                onClick={() => setActiveTab('assignmentMethod')}
              >
                Assignment method
              </button>
              <button
                className={`edit-tab ${activeTab === 'afterCallWork' ? 'active' : ''}`}
                onClick={() => setActiveTab('afterCallWork')}
              >
                After call work
              </button>
              <button
                className={`edit-tab ${activeTab === 'consultTransfer' ? 'active' : ''}`}
                onClick={() => setActiveTab('consultTransfer')}
              >
                Consult/Transfer
              </button>
              <button
                className={`edit-tab ${activeTab === 'postCallSurvey' ? 'active' : ''}`}
                onClick={() => setActiveTab('postCallSurvey')}
              >
                Post-call survey
              </button>
              <button
                className={`edit-tab ${activeTab === 'sessionTemplate' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessionTemplate')}
              >
                Session template
              </button>
            </nav>
          </aside>

          <div className="edit-main-area">
            {activeTab === 'automatedMessages' && (
              <div className="form-section">
                <h2 className="section-label">Automated Messages</h2>
                <p className="form-help-text">
                  Configure automated messages that are sent to customers based on specific triggers during their
                  interaction. These messages keep customers informed about their conversation status and wait times.
                </p>

                {/* AgCD Section */}
                {renderAgCDSection('Automated messages', 'orchestration', 'Automated messages', 'automatedMessages')}

                {/* Traditional Configuration Card */}
                <div className="traditional-config-card">
                  <h3 className="config-card-title">Message triggers</h3>
                  <div className="greetings-list">
                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Agent assigned</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "You are now connected with {'{'} AgentName {'}'}. How can I help you today?"
                    </div>
                  </div>

                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Average wait time</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "Your estimated wait time is {'{'} WaitTime {'}'} minutes. Thank you for your patience."
                    </div>
                  </div>

                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Conversation transferred</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "I'm transferring you to a specialist who can better assist with your request. Please hold."
                    </div>
                  </div>

                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Agent ended conversation</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "Thank you for contacting us. Your conversation has been ended. Have a great day!"
                    </div>
                  </div>

                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Customer ended conversation</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "The customer has ended the conversation."
                    </div>
                  </div>

                  <div className="greeting-item">
                    <div className="greeting-header">
                      <span className="greeting-trigger">Position in queue</span>
                      <button className="edit-greeting-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 3 4 9.5V11h1.5l6.5-6.5-.707-.707z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                    <div className="greeting-message">
                      "You are currently number {'{'} QueuePosition {'}'} in the queue. We appreciate your patience."
                    </div>
                  </div>

                    <button className="add-greeting-button">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Add message trigger
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="form-section">
                <h2 className="section-label">Notifications</h2>
                <p className="form-help-text">
                  Configure which notification templates are used for different scenarios. Notifications alert
                  agents about important events during customer interactions.
                </p>

                <div className="form-group-section">
                  <div className="form-group">
                    <label className="form-label">Incoming call</label>
                    <select className="form-select" defaultValue="default-incoming">
                      <option value="">Select notification template</option>
                      <option value="default-incoming">Default Incoming Call Notification</option>
                      <option value="priority-incoming">Priority Incoming Call Notification</option>
                      <option value="vip-incoming">VIP Incoming Call Notification</option>
                      <option value="custom-incoming">Custom Incoming Notification</option>
                    </select>
                    <p className="form-help-text">
                      Notification shown to agents when a new call arrives in their queue
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transferred call</label>
                    <select className="form-select" defaultValue="default-transfer">
                      <option value="">Select notification template</option>
                      <option value="default-transfer">Default Transfer Notification</option>
                      <option value="urgent-transfer">Urgent Transfer Notification</option>
                      <option value="escalation-transfer">Escalation Transfer Notification</option>
                    </select>
                    <p className="form-help-text">
                      Notification shown when a call is transferred to an agent
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consult request</label>
                    <select className="form-select" defaultValue="default-consult">
                      <option value="">Select notification template</option>
                      <option value="default-consult">Default Consult Notification</option>
                      <option value="expert-consult">Expert Consult Request</option>
                      <option value="manager-consult">Manager Consult Request</option>
                    </select>
                    <p className="form-help-text">
                      Notification shown when another agent requests a consultation
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer disconnect</label>
                    <select className="form-select" defaultValue="default-disconnect">
                      <option value="">Select notification template</option>
                      <option value="default-disconnect">Default Disconnect Notification</option>
                      <option value="abrupt-disconnect">Abrupt Disconnect Notification</option>
                    </select>
                    <p className="form-help-text">
                      Notification shown when a customer disconnects during an interaction
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supervisor monitor</label>
                    <select className="form-select" defaultValue="default-monitor">
                      <option value="">Select notification template</option>
                      <option value="default-monitor">Default Monitor Notification</option>
                      <option value="silent-monitor">Silent Monitor Notification</option>
                      <option value="qa-monitor">Quality Assurance Monitor</option>
                    </select>
                    <p className="form-help-text">
                      Notification shown when a supervisor is monitoring the conversation
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workDistribution' && (
              <div className="form-section">
                <h2 className="section-label">Work Distribution</h2>
                <p className="form-help-text">
                  Configure how work items are distributed to agents based on their presence, skills, and capacity.
                  These settings determine which agents are eligible to receive work and how it's assigned.
                </p>

                <div className="form-group-section">
                  <h3 className="subsection-title">Allowed presence</h3>
                  <p className="form-help-text">
                    Select which agent presence statuses are eligible to receive new work assignments
                  </p>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Available</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Busy</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" />
                      <span>Busy - DND</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" />
                      <span>Away</span>
                    </label>
                  </div>
                </div>

                <div className="form-group-section">
                  <h3 className="subsection-title">Skill matching</h3>
                  <div className="form-group">
                    <label className="form-label">Skill matching algorithm</label>
                    <select className="form-select" defaultValue="exact">
                      <option value="exact">Exact match - Only agents with exact skills</option>
                      <option value="nearest">Nearest match - Agents with closest skill set</option>
                      <option value="none">None - No skill matching required</option>
                    </select>
                    <p className="form-help-text">
                      Determines how agent skills are matched against work item requirements. Exact match ensures
                      only agents with all required skills receive work, while nearest match finds the closest
                      available match when exact matches aren't available.
                    </p>
                  </div>
                </div>

                <div className="form-group-section">
                  <h3 className="subsection-title">Capacity</h3>
                  <div className="form-group">
                    <label className="form-label">Capacity profile</label>
                    <select className="form-select" defaultValue="default-capacity">
                      <option value="default-capacity">Default Capacity Profile</option>
                      <option value="high-capacity">High Volume Capacity Profile</option>
                      <option value="low-capacity">Low Volume Capacity Profile</option>
                      <option value="omnichannel-capacity">Omnichannel Capacity Profile</option>
                      <option value="custom-capacity">Custom Capacity Profile</option>
                    </select>
                    <p className="form-help-text">
                      Defines how many concurrent interactions an agent can handle. Capacity profiles set limits
                      for different channel types (voice, chat, email) to prevent agent overload.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overflow' && (
              <div className="form-section">
                <h2 className="section-label">Overflow</h2>
                <p className="form-help-text">
                  Configure overflow routing rules to handle scenarios when queues reach capacity or wait times exceed thresholds.
                  Overflow strategies ensure customers receive timely assistance even during high-demand periods.
                </p>

                {/* AgCD Section */}
                {renderAgCDSection('Overflow', 'orchestration', 'Overflow handling', 'overflow')}
              </div>
            )}

            {activeTab === 'dynamicPrioritization' && (
              <div className="form-section">
                <h2 className="section-label">Dynamic Prioritization</h2>
                <p className="form-help-text">
                  Configure rules to dynamically adjust work item priorities based on real-time conditions such as wait time,
                  customer sentiment, transfer events, and business requirements. Ensure critical issues receive immediate attention.
                </p>

                {/* AgCD Section */}
                {renderAgCDSection('Dynamic prioritization', 'orchestration', 'Dynamic prioritization', 'dynamicPrioritization')}
              </div>
            )}

            {activeTab === 'assignmentMethod' && (
              <div className="form-section">
                <h2 className="section-label">Assignment Method</h2>
                <p className="form-help-text">
                  Choose how work items are assigned to available agents. The assignment method determines
                  which agent receives the next work item when multiple eligible agents are available.
                </p>

                {/* AgCD Section */}
                {renderAgCDSection('Assignment method', 'assignment', 'Assign to a predicted expert', 'assignmentMethod')}

                {/* Traditional Configuration Card */}
                <div className="traditional-config-card">
                  <h3 className="config-card-title">Assignment settings</h3>
                  <div className="form-group-section">
                  <div className="form-group">
                    <label className="form-label">Assignment method</label>
                    <select className="form-select" defaultValue="round-robin">
                      <option value="round-robin">Round robin - Distribute evenly across all agents</option>
                      <option value="highest-capacity">Highest capacity - Assign to agent with most availability</option>
                      <option value="least-active">Least active - Assign to agent with least recent activity</option>
                      <option value="custom">Custom assignment rules</option>
                    </select>
                    <p className="form-help-text">
                      <strong>Round robin:</strong> Distributes work evenly among all eligible agents in rotation.
                      <br />
                      <strong>Highest capacity:</strong> Prioritizes agents with the most available capacity to handle additional work.
                      <br />
                      <strong>Least active:</strong> Assigns work to the agent who has been idle longest or handled the fewest recent interactions.
                      <br />
                      <strong>Custom:</strong> Use custom business rules to determine assignment logic.
                    </p>
                  </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span>Enable agent affinity</span>
                      </label>
                      <p className="form-help-text">
                        When enabled, attempts to assign returning customers to agents they've previously worked with
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'afterCallWork' && (
              <div className="form-section">
                <h2 className="section-label">After Call Work</h2>
                <p className="form-help-text">
                  Configure the after-call work (ACW) period that agents receive after completing a customer
                  interaction. During ACW, agents can complete notes, update records, and prepare for the next
                  interaction without receiving new work assignments.
                </p>

                <div className="form-group-section">
                  <div className="form-group">
                    <label className="form-label">After call work setting</label>
                    <select className="form-select" defaultValue="custom">
                      <option value="always-block">Always block - ACW time always provided after calls</option>
                      <option value="never-block">Never block - No ACW time, immediate availability</option>
                      <option value="custom">Custom time - Specify ACW duration</option>
                    </select>
                    <p className="form-help-text">
                      <strong>Always block:</strong> Agents always receive ACW time after every interaction to complete
                      post-call tasks without interruption.
                      <br />
                      <strong>Never block:</strong> Agents are immediately available for new work after ending an interaction.
                      Best for high-volume environments where post-call work is minimal.
                      <br />
                      <strong>Custom time:</strong> Define a specific duration for ACW based on your organization's needs.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ACW duration (seconds)</label>
                    <input
                      type="number"
                      className="form-input"
                      defaultValue="30"
                      min="0"
                      max="600"
                    />
                    <p className="form-help-text">
                      Specify how long agents should remain unavailable for new work after completing an interaction (0-600 seconds)
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" />
                      <span>Allow agents to extend ACW time</span>
                    </label>
                    <p className="form-help-text">
                      When enabled, agents can manually extend their ACW period if additional time is needed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'consultTransfer' && (
              <div className="form-section">
                <h2 className="section-label">Consult/Transfer Settings</h2>
                <p className="form-help-text">
                  Configure whether agents can consult with other agents or transfer conversations to other
                  queues or agents. These settings control collaboration and escalation capabilities.
                </p>

                <div className="form-group-section">
                  <h3 className="subsection-title">Consultation settings</h3>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={consultEnabled}
                        onChange={(e) => setConsultEnabled(e.target.checked)}
                      />
                      <span>Enable consult</span>
                    </label>
                    <p className="form-help-text">
                      Allow agents to consult with other agents while keeping the customer on hold. During a
                      consult, agents can get expert advice or assistance without transferring the customer.
                    </p>
                  </div>

                  {consultEnabled && (
                    <>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                          <span>Allow consult with any agent</span>
                        </label>
                        <p className="form-help-text">
                          Agents can consult with any available agent in the organization
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                          <span>Allow consult with specific queues</span>
                        </label>
                        <p className="form-help-text">
                          Agents can request consultation from agents in specific queues
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group-section">
                  <h3 className="subsection-title">Transfer settings</h3>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={transferEnabled}
                        onChange={(e) => setTransferEnabled(e.target.checked)}
                      />
                      <span>Enable transfer</span>
                    </label>
                    <p className="form-help-text">
                      Allow agents to transfer conversations to other agents or queues. Transfers move the entire
                      customer interaction to another agent who takes over the conversation.
                    </p>
                  </div>

                  {transferEnabled && (
                    <>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                          <span>Allow transfer to any agent</span>
                        </label>
                        <p className="form-help-text">
                          Agents can transfer conversations directly to any available agent
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                          <span>Allow transfer to queues</span>
                        </label>
                        <p className="form-help-text">
                          Agents can transfer conversations to other queues for specialized handling
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" className="form-checkbox" />
                          <span>Require supervisor approval for transfers</span>
                        </label>
                        <p className="form-help-text">
                          All transfer requests must be approved by a supervisor before completion
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'postCallSurvey' && (
              <div className="form-section">
                <h2 className="section-label">Post-Call Survey</h2>
                <p className="form-help-text">
                  Configure automated post-call surveys to gather customer feedback after interactions. Select
                  a Copilot Studio bot that will conduct the survey and collect customer satisfaction data.
                </p>

                <div className="form-group-section">
                  <div className="form-group">
                    <label className="form-label">Survey bot</label>
                    <select className="form-select" defaultValue="csat-bot">
                      <option value="">No survey - Skip post-call survey</option>
                      <option value="csat-bot">Customer Satisfaction Survey Bot</option>
                      <option value="nps-bot">Net Promoter Score (NPS) Bot</option>
                      <option value="detailed-feedback-bot">Detailed Feedback Survey Bot</option>
                      <option value="quick-rating-bot">Quick Rating Bot (1-5 stars)</option>
                      <option value="custom-survey-bot">Custom Survey Bot</option>
                    </select>
                    <p className="form-help-text">
                      Select the Copilot Studio bot that will interact with customers after the call ends.
                      The bot will ask predefined questions and collect responses for analysis.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Enable survey for all calls</span>
                    </label>
                    <p className="form-help-text">
                      When enabled, the survey is offered to all customers after call completion
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" />
                      <span>Allow customers to skip survey</span>
                    </label>
                    <p className="form-help-text">
                      Customers can opt out of the survey if they don't wish to provide feedback
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Survey trigger condition</label>
                    <select className="form-select" defaultValue="all-calls">
                      <option value="all-calls">All calls - Survey after every call</option>
                      <option value="resolved-only">Resolved calls only</option>
                      <option value="duration-threshold">Calls exceeding duration threshold</option>
                      <option value="random-sample">Random sample of calls</option>
                    </select>
                    <p className="form-help-text">
                      Define when the survey should be triggered based on call characteristics
                    </p>
                  </div>

                  <div className="form-group">
                    <a href="#" className="external-link">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 2H8v2h3.59L6 9.59 7.41 11 13 5.41V9h2V2z" />
                        <path d="M12 12H4V4h4V2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v4z" />
                      </svg>
                      Create or modify survey bots in Copilot Studio
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessionTemplate' && (
              <div className="form-section">
                <h2 className="section-label">Session Template</h2>
                <p className="form-help-text">
                  Select a session template that defines the agent workspace layout and available tools during
                  customer interactions. Session templates control which panels, tabs, and features are visible
                  to agents when handling conversations.
                </p>

                <div className="form-group-section">
                  <div className="form-group">
                    <label className="form-label">Session template</label>
                    <select className="form-select" defaultValue="default-voice">
                      <option value="default-voice">Default Voice Session Template</option>
                      <option value="omnichannel-session">Omnichannel Session Template</option>
                      <option value="customer-service-session">Customer Service Session Template</option>
                      <option value="sales-session">Sales Session Template</option>
                      <option value="technical-support-session">Technical Support Session Template</option>
                      <option value="minimal-session">Minimal Session Template</option>
                      <option value="custom-session">Custom Session Template</option>
                    </select>
                    <p className="form-help-text">
                      The session template determines the agent's workspace layout, including which customer
                      information panels, knowledge base articles, and productivity tools are available during
                      the interaction.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default tab</label>
                    <select className="form-select" defaultValue="customer-summary">
                      <option value="customer-summary">Customer Summary</option>
                      <option value="case-details">Case Details</option>
                      <option value="knowledge-base">Knowledge Base</option>
                      <option value="timeline">Timeline</option>
                      <option value="related-cases">Related Cases</option>
                    </select>
                    <p className="form-help-text">
                      The default tab that opens when an agent accepts a new conversation
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Show customer information panel</span>
                    </label>
                    <p className="form-help-text">
                      Display customer details, contact information, and interaction history
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Show knowledge base panel</span>
                    </label>
                    <p className="form-help-text">
                      Provide quick access to knowledge articles and support documentation
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span>Show script guidance panel</span>
                    </label>
                    <p className="form-help-text">
                      Display agent scripts and conversation guidance for consistent service delivery
                    </p>
                  </div>

                  <div className="form-group">
                    <a href="#" className="external-link">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 2H8v2h3.59L6 9.59 7.41 11 13 5.41V9h2V2z" />
                        <path d="M12 12H4V4h4V2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v4z" />
                      </svg>
                      Customize session templates in App Profile Manager
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EngagementProfileEdit;
