import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserGroupById, saveUserGroup } from '../lib/userGroupStorage';
import { MOCK_USERS, MOCK_QUEUES } from '../lib/userGroupMockData';
import { getEligibleUsers, EXAMPLE_CRITERIA } from '../lib/userGroupEligibility';
import type { UserGroup } from '../lib/userGroupTypes';
import QueueSelectionSidecar from './QueueSelectionSidecar';
import './UserGroupEdit.css';

const UserGroupEditDynamic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // Basic fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Dynamic group fields
  const [criteria, setCriteria] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Queue fields
  const [associatedQueueIds, setAssociatedQueueIds] = useState<string[]>([]);
  const [showQueueSidecar, setShowQueueSidecar] = useState(false);

  // Tracking
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalGroup, setOriginalGroup] = useState<UserGroup | null>(null);

  // Success banner state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Track the saved group ID (for new groups, this gets set after first save)
  const [savedGroupId, setSavedGroupId] = useState<string | null>(isNew ? null : id || null);

  useEffect(() => {
    if (!isNew && id) {
      const group = getUserGroupById(id);
      if (group) {
        setName(group.name);
        setDescription(group.description);
        setCriteria(group.eligibilityCriteria || '');
        setAssociatedQueueIds(group.associatedQueueIds);
        setOriginalGroup(group);
        setShowPreview(true);
      }
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && originalGroup) {
      const changed =
        name !== originalGroup.name ||
        description !== originalGroup.description ||
        criteria !== originalGroup.eligibilityCriteria ||
        JSON.stringify(associatedQueueIds) !== JSON.stringify(originalGroup.associatedQueueIds);
      setHasUnsavedChanges(changed);
    } else if (isNew) {
      setHasUnsavedChanges(
        name.trim() !== '' ||
        description.trim() !== '' ||
        criteria.trim() !== '' ||
        associatedQueueIds.length > 0
      );
    }
  }, [name, description, criteria, associatedQueueIds, originalGroup, isNew]);

  // Eligible users for dynamic groups
  const eligibleUsers = useMemo(() => {
    if (!criteria) return [];
    return getEligibleUsers(MOCK_USERS, criteria);
  }, [criteria]);

  const associatedQueues = useMemo(() => {
    return MOCK_QUEUES.filter(q => associatedQueueIds.includes(q.id));
  }, [associatedQueueIds]);

  const availableQueues = useMemo(() => {
    return MOCK_QUEUES.filter(q => !associatedQueueIds.includes(q.id));
  }, [associatedQueueIds]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (!criteria.trim()) return;

    // Determine if this is a new group being created
    const isCreating = savedGroupId === null;
    const groupId = isCreating ? Date.now().toString() : (savedGroupId || id || Date.now().toString());

    const group: UserGroup = {
      id: groupId,
      name,
      description,
      type: 'dynamic',
      eligibilityCriteria: criteria,
      associatedQueueIds,
      lastUpdated: new Date().toISOString()
    };

    saveUserGroup(group);

    // Update the saved group ID for subsequent saves
    if (isCreating) {
      setSavedGroupId(groupId);
      // Update URL to reflect we're now editing an existing group (without navigation)
      window.history.replaceState({}, '', `/profiles-with-agcd/user-group-dynamic/${groupId}`);
    }

    // Update original group for change tracking
    setOriginalGroup(group);

    // Show success banner
    setSuccessMessage(isCreating ? 'User group created' : 'User group saved');
    setShowSuccessBanner(true);

    // Auto-hide banner after 5 seconds
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);
  };

  const handleBack = () => {
    navigate('/user-groups-dynamic');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleRemoveQueue = (queueId: string) => {
    setAssociatedQueueIds(prev => prev.filter(id => id !== queueId));
  };

  const handleAddQueues = (queueIds: string[]) => {
    setAssociatedQueueIds(prev => [...new Set([...prev, ...queueIds])]);
    setShowQueueSidecar(false);
  };

  const canSave = name.trim() && criteria.trim();

  return (
    <main className="main-content user-group-edit-page">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="success-banner">
          <div className="success-banner-content">
            <svg className="success-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#107c10" strokeWidth="2" />
              <path d="M6 10l3 3 5-6" stroke="#107c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="success-message">{successMessage}</span>
          </div>
          <button className="success-banner-close" onClick={() => setShowSuccessBanner(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="save-button-toolbar" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </div>
        <div className="toolbar-right"></div>
      </div>

      {/* Breadcrumb and Title */}
      <div className="content-header">
        <div className="breadcrumb-nav">
          <Link to="/user-groups-dynamic" className="breadcrumb-link">Dynamic user groups</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{savedGroupId ? name || 'Edit' : 'New'}</span>
        </div>
        <div className="title-with-back">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z" />
            </svg>
          </button>
          <h1 className="page-title">{savedGroupId ? name || 'Dynamic user group' : 'New dynamic user group'}</h1>
        </div>
        {savedGroupId && description && (
          <p className="page-description">{description}</p>
        )}
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Name and Description Card */}
        <div className="form-card">
          <div className="form-fields">
            <div className="form-field">
              <label htmlFor="name" className="field-label">
                Name <span className="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user group name"
              />
            </div>

            <div className="form-field">
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                id="description"
                className="field-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this user group"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Eligibility Criteria Card */}
        <div className="form-card">
          <h2 className="card-title">Eligibility criteria</h2>
          <p className="card-description">
            Define users' eligibility criteria using natural language. Supported attributes: Skills, Language, Region, Capacity profile, Intent.
          </p>

          <div className="form-fields">
            <div className="form-field">
              <textarea
                id="criteria"
                className="field-textarea field-textarea-mono"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="Example: Users with Spanish or English language, Skills Gold tier or Platinum tier..."
                rows={4}
              />
            </div>

            <div className="example-criteria">
              <p className="example-label">Example criteria:</p>
              <div className="example-buttons">
                {EXAMPLE_CRITERIA.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCriteria(example)}
                    className="example-button"
                  >
                    {example.length > 80 ? example.substring(0, 80) + '...' : example}
                  </button>
                ))}
              </div>
            </div>

            {criteria && (
              <button className="preview-button" onClick={handlePreview} disabled={!criteria.trim()}>
                Preview eligible users
              </button>
            )}
          </div>
        </div>

        {showPreview && (
          <div className="form-card">
            <div className="card-header-with-badge">
              <h2 className="card-title">Eligible users</h2>
              <span className="count-badge">{eligibleUsers.length}</span>
            </div>
            <p className="eligible-users-subtext">
              This is only an indicative list of eligible users.
            </p>

            {eligibleUsers.length === 0 ? (
              <div className="empty-message">
                No eligible users found based on current eligibility criteria.
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Skills</th>
                      <th>Language</th>
                      <th>Region</th>
                      <th>Capacity Profile</th>
                      <th>Intent</th>
                      <th>Current Presence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="user-name">{user.name}</td>
                        <td>
                          <div className="badge-list">
                            {user.skills.map((skill) => (
                              <span key={skill} className="attribute-badge">{skill}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.language.map((lang) => (
                              <span key={lang} className="attribute-badge">{lang}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.region.map((reg) => (
                              <span key={reg} className="attribute-badge">{reg}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.capacityProfile.map((cap) => (
                              <span key={cap} className="attribute-badge">{cap}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.intent.map((int) => (
                              <span key={int} className="attribute-badge">{int}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`presence-badge ${user.presence === 'Available' ? 'presence-available' : 'presence-busy'}`}>
                            {user.presence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Associated Queues Card */}
        <div className="form-card">
          <div className="card-header-with-badge">
            <h2 className="card-title">Associated queues</h2>
            <span className="count-badge">{associatedQueues.length}</span>
            <button className="add-queues-button" onClick={() => setShowQueueSidecar(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add queues
            </button>
          </div>

          {associatedQueues.length === 0 ? (
            <div className="empty-message">
              No queues associated with this user group yet
            </div>
          ) : (
            <div className="queues-table-container">
              <table className="queues-table">
                <thead>
                  <tr>
                    <th>Queue Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="actions-column"></th>
                  </tr>
                </thead>
                <tbody>
                  {associatedQueues.map((queue) => (
                    <tr key={queue.id}>
                      <td className="queue-name">{queue.name}</td>
                      <td>
                        <span className="type-badge">{queue.type}</span>
                      </td>
                      <td className="queue-description">{queue.description}</td>
                      <td className="actions-column">
                        <button className="remove-button" onClick={() => handleRemoveQueue(queue.id)}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Queue Selection Sidecar */}
      <QueueSelectionSidecar
        isOpen={showQueueSidecar}
        onClose={() => setShowQueueSidecar(false)}
        onSave={handleAddQueues}
        availableQueues={availableQueues}
        currentlyAssociatedIds={associatedQueueIds}
      />
    </main>
  );
};

export default UserGroupEditDynamic;
