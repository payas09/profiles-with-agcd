import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './QueueEdit.css';
import { getUserGroups } from '../lib/userGroupStorage';
import type { UserGroup } from '../lib/userGroupTypes';

// Map queue IDs to names and types
const queueData: { [key: string]: { name: string; type: string; owner: string } } = {
  'q1': { name: 'General Support Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q2': { name: 'VIP Support Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q3': { name: 'Technical Support Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q4': { name: 'Sales Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q5': { name: 'Billing Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q6': { name: 'Chat Support Queue', type: 'Chat', owner: 'Aurora365 User6' },
  'q7': { name: 'Live Chat Queue', type: 'Chat', owner: 'Aurora365 User6' },
  'q8': { name: 'Case Management Queue', type: 'Record', owner: 'Aurora365 User6' },
  'q9': { name: 'Emergency Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q10': { name: 'After Hours Queue', type: 'Voice', owner: 'Aurora365 User6' },
  'q11': { name: 'Social Media Queue', type: 'Chat', owner: 'Aurora365 User6' },
  'q12': { name: 'Email Support Queue', type: 'Record', owner: 'Aurora365 User6' }
};

interface QueueUser {
  id: string;
  name: string;
  type: string;
  role: string;
  capacityProfile: string;
  capacity: number;
  businessUnit: string;
  date: string;
}

const queueUsers: QueueUser[] = [
  {
    id: 'u1',
    name: 'Lorenzo Russet',
    type: 'User',
    role: 'Representative, Supervisor',
    capacityProfile: 'Default voice outbound, ...',
    capacity: 1000,
    businessUnit: 'aurorabagenv3fe39',
    date: '11/15/2025'
  },
  {
    id: 'u2',
    name: 'Sarah Johnson',
    type: 'User',
    role: 'Representative',
    capacityProfile: 'Default voice outbound, ...',
    capacity: 800,
    businessUnit: 'aurorabagenv3fe39',
    date: '10/22/2025'
  },
  {
    id: 'u3',
    name: 'Michael Chen',
    type: 'User',
    role: 'Representative',
    capacityProfile: 'Default voice outbound, ...',
    capacity: 900,
    businessUnit: 'aurorabagenv3fe39',
    date: '11/01/2025'
  }
];

// Engagement profiles data
const engagementProfiles = [
  { id: 'profile1', name: 'Standard Support Profile' },
  { id: 'profile2', name: 'VIP Customer Profile' },
  { id: 'profile3', name: 'Technical Support Profile' },
  { id: 'profile4', name: 'Sales Team Profile' },
  { id: 'profile5', name: 'After-Hours Profile' },
  { id: 'profile6', name: 'Billing Support Profile' }
];

const engagementProfileConfigs: { [key: string]: any } = {
  'profile1': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates assigned',
    workDistribution: 'Exact match skill algorithm, Default capacity profile',
    assignmentMethod: 'Round robin with agent affinity',
    afterCallWork: 'Custom time (30 seconds)',
    consultTransfer: 'Both consult and transfer enabled',
    postCallSurvey: 'Customer Satisfaction Survey Bot',
    sessionTemplate: 'Default Voice Session Template'
  },
  'profile2': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates with priority alerts',
    workDistribution: 'Exact match skill algorithm, High Volume Capacity Profile',
    assignmentMethod: 'Highest capacity',
    afterCallWork: 'Custom time (60 seconds)',
    consultTransfer: 'Both consult and transfer enabled',
    postCallSurvey: 'Net Promoter Score (NPS) Bot',
    sessionTemplate: 'Omnichannel Session Template'
  },
  'profile3': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates assigned',
    workDistribution: 'Nearest match skill algorithm, Default capacity profile',
    assignmentMethod: 'Least active',
    afterCallWork: 'Custom time (45 seconds)',
    consultTransfer: 'Both consult and transfer enabled',
    postCallSurvey: 'Detailed Feedback Survey Bot',
    sessionTemplate: 'Technical Support Session Template'
  },
  'profile4': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates assigned',
    workDistribution: 'Exact match skill algorithm, Default capacity profile',
    assignmentMethod: 'Round robin',
    afterCallWork: 'Custom time (30 seconds)',
    consultTransfer: 'Both consult and transfer enabled',
    postCallSurvey: 'Quick Rating Bot (1-5 stars)',
    sessionTemplate: 'Sales Session Template'
  },
  'profile5': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates assigned',
    workDistribution: 'None skill matching, Low Volume Capacity Profile',
    assignmentMethod: 'Round robin',
    afterCallWork: 'Never block',
    consultTransfer: 'Transfer only (consult disabled)',
    postCallSurvey: 'No survey',
    sessionTemplate: 'Minimal Session Template'
  },
  'profile6': {
    automatedMessages: '6 message triggers configured',
    notifications: '5 notification templates assigned',
    workDistribution: 'Exact match skill algorithm, Default capacity profile',
    assignmentMethod: 'Least active',
    afterCallWork: 'Custom time (30 seconds)',
    consultTransfer: 'Both consult and transfer enabled',
    postCallSurvey: 'Customer Satisfaction Survey Bot',
    sessionTemplate: 'Customer Service Session Template'
  }
};

const QueueEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [userGroupSearchQuery, setUserGroupSearchQuery] = useState('');
  const [selectedEngagementProfile, setSelectedEngagementProfile] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'userGroups'>('users');
  const [associatedUserGroups, setAssociatedUserGroups] = useState<UserGroup[]>([]);

  const queue = id ? queueData[id] : null;
  const queueName = queue?.name || 'Unknown Queue';
  const queueType = queue?.type || 'Unknown';
  const queueOwner = queue?.owner || 'Unknown';

  // Fetch user groups associated with this queue
  useEffect(() => {
    if (id) {
      const allUserGroups = getUserGroups();
      const filtered = allUserGroups.filter(group =>
        group.associatedQueueIds.includes(id)
      );
      setAssociatedUserGroups(filtered);
    }
  }, [id]);

  const filteredUsers = queueUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserGroups = associatedUserGroups.filter(group =>
    group.name.toLowerCase().includes(userGroupSearchQuery.toLowerCase())
  );

  const selectedProfileConfig = engagementProfileConfigs[selectedEngagementProfile];

  return (
    <div className="queue-edit-page">
      <main className="main-content">
        {/* Refresh button */}
        <div className="refresh-bar">
          <button className="refresh-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Header */}
        <div className="queue-header">
          <div className="breadcrumb-container">
            <Link to="/queues" className="breadcrumb-link">Queues</Link>
            <svg className="breadcrumb-separator" width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
              <path d="M2 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="breadcrumb-current">Advanced queues</span>
          </div>
          <div className="queue-title-row">
            <h1 className="queue-title">{queueName}</h1>
            <button className="edit-link-button">Edit</button>
          </div>
          <div className="queue-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Type</span>
              <span className="metadata-value">{queueType}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Owner</span>
              <span className="metadata-value">{queueOwner}</span>
            </div>
          </div>
        </div>

        {/* Users and User Groups Section */}
        <div className="queue-section">
          <div className="section-header">
            <div className="section-tabs">
              <button
                className={`section-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              <button
                className={`section-tab ${activeTab === 'userGroups' ? 'active' : ''}`}
                onClick={() => setActiveTab('userGroups')}
              >
                User groups
              </button>
            </div>
            <div className="section-actions">
              {activeTab === 'users' ? (
                <>
                  <div className="search-box-inline">
                    <svg className="search-icon-inline" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search"
                      className="search-input-inline"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="see-more-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                    See more
                  </button>
                  <button className="add-users-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add users
                  </button>
                </>
              ) : (
                <>
                  <div className="search-box-inline">
                    <svg className="search-icon-inline" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search"
                      className="search-input-inline"
                      value={userGroupSearchQuery}
                      onChange={(e) => setUserGroupSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="see-more-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                    See more
                  </button>
                  <button className="add-users-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add user groups
                  </button>
                </>
              )}
            </div>
          </div>

          {activeTab === 'users' ? (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <div className="th-content-queue">
                        Name
                        <svg className="sort-icon-queue" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 3l3 4H3l3-4z" />
                        </svg>
                      </div>
                    </th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Capacity profile</th>
                    <th>Capacity</th>
                    <th>Business unit</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <a href="#" className="user-link">{user.name}</a>
                      </td>
                      <td>{user.type}</td>
                      <td>{user.role}</td>
                      <td>{user.capacityProfile}</td>
                      <td>{user.capacity}</td>
                      <td>{user.businessUnit}</td>
                      <td>{user.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <span className="table-count">{filteredUsers.length} of {queueUsers.length}</span>
              </div>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <div className="th-content-queue">
                        Name
                        <svg className="sort-icon-queue" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 3l3 4H3l3-4z" />
                        </svg>
                      </div>
                    </th>
                    <th>Description</th>
                    <th>Eligibility criteria</th>
                    <th>Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserGroups.length > 0 ? (
                    filteredUserGroups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <Link to={`/user-group/${group.id}`} className="user-link">{group.name}</Link>
                        </td>
                        <td>{group.description}</td>
                        <td>{group.eligibilityCriteria}</td>
                        <td>{new Date(group.lastUpdated).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="empty-table-message">
                        No user groups associated with this queue
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="table-footer">
                <span className="table-count">{filteredUserGroups.length} of {associatedUserGroups.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Profile Section */}
        <div className="queue-section">
          <h2 className="section-title">Engagement profile</h2>
          <p className="engagement-profile-help">
            Engagement profiles define how agents and customers interact during conversations. This includes automated messages, notifications, work distribution rules, assignment methods, and post-interaction settings. Select an engagement profile to configure the agent experience for this queue.
          </p>

          <div className="form-group">
            <label className="form-label">Select engagement profile</label>
            <select
              className="form-select"
              value={selectedEngagementProfile}
              onChange={(e) => setSelectedEngagementProfile(e.target.value)}
            >
              <option value="">Choose an engagement profile</option>
              {engagementProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEngagementProfile && selectedProfileConfig && (
            <div className="engagement-profile-summary">
              <div className="summary-header">
                <h3 className="summary-title">Configuration Summary</h3>
                <Link to={`/engagement-profile/${selectedEngagementProfile}`} className="edit-profile-link">
                  Edit
                </Link>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-label">Automated messages</div>
                  <div className="summary-value">{selectedProfileConfig.automatedMessages}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Notifications</div>
                  <div className="summary-value">{selectedProfileConfig.notifications}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Work distribution</div>
                  <div className="summary-value">{selectedProfileConfig.workDistribution}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Assignment method</div>
                  <div className="summary-value">{selectedProfileConfig.assignmentMethod}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">After call work</div>
                  <div className="summary-value">{selectedProfileConfig.afterCallWork}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Consult/Transfer</div>
                  <div className="summary-value">{selectedProfileConfig.consultTransfer}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Post-call survey</div>
                  <div className="summary-value">{selectedProfileConfig.postCallSurvey}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Session template</div>
                  <div className="summary-value">{selectedProfileConfig.sessionTemplate}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Method and Overflow Handling */}
        <div className="queue-columns">
          <div className="queue-column">
            <div className="queue-section">
              <div className="section-header-inline">
                <h2 className="section-title">Assignment method</h2>
                <a href="#" className="learn-more-link-inline">Learn more</a>
                <button className="see-more-button">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                  </svg>
                  See more
                </button>
              </div>

              <div className="assignment-method-content">
                <div className="assignment-method-card">
                  <div className="assignment-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#0078d4" />
                    </svg>
                  </div>
                  <div className="assignment-details">
                    <div className="assignment-title-row">
                      <span className="assignment-title">Least active</span>
                      <span className="read-only-badge">Read-only</span>
                    </div>
                    <p className="assignment-description">
                      Work items will be prioritized in the order they enter the queue. Among the representatives who match skills, presence, and capacity, work will be assigned to the representative who is least active across voice and messaging queues. <a href="#">Learn more</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="queue-column">
            <div className="queue-section">
              <h2 className="section-title">Overflow handling</h2>
              <div className="overflow-handling-content">
                <p className="section-description">
                  Define conditions for queue overflows and actions to resolve them. <a href="#">Learn more</a>
                </p>
                <button className="add-condition-button">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add condition-action pair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Operation Hours Section */}
        <div className="queue-section">
          <div className="section-header-inline">
            <h2 className="section-title">Operation hours</h2>
            <span className="optional-badge">Optional</span>
          </div>

          <div className="operation-hours-content">
            <h3 className="operation-hours-title">Set your operation hours</h3>
            <p className="operation-hours-description">
              Choose the days and hours for this queue to be active. Any live chat messages routed to the queue during non-operating hours will be closed. The async messages will be assigned to the representative or remain in open state as per the work distribution settings. If no operation hours are set, this queue will be active 24/7. <a href="#">Learn more</a>. Note that representative operating hours are different from queue operating hours. To assign work based on representative schedule, configure calendar operator rule in custom assignment as explained here. <a href="#">Assignment methods for queues</a>.
            </p>
            <button className="set-hours-button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Set operation hours
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QueueEdit;
