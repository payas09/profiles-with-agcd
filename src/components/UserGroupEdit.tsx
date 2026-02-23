import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserGroupById, saveUserGroup } from '../lib/userGroupStorage';
import { MOCK_USERS, MOCK_QUEUES } from '../lib/userGroupMockData';
import { getEligibleUsers, EXAMPLE_CRITERIA } from '../lib/userGroupEligibility';
import type { UserGroup } from '../lib/userGroupTypes';
import './UserGroupEdit.css';

const UserGroupEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [associatedQueueIds, setAssociatedQueueIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [tempSelectedQueues, setTempSelectedQueues] = useState<string[]>([]);
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalGroup, setOriginalGroup] = useState<UserGroup | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const group = getUserGroupById(id);
      if (group) {
        setName(group.name);
        setDescription(group.description);
        setCriteria(group.eligibilityCriteria);
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
      setHasUnsavedChanges(name.trim() !== '' || description.trim() !== '' || criteria.trim() !== '' || associatedQueueIds.length > 0);
    }
  }, [name, description, criteria, associatedQueueIds, originalGroup, isNew]);

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

  const filteredQueues = useMemo(() => {
    if (!queueSearchQuery.trim()) return availableQueues;

    const query = queueSearchQuery.toLowerCase();
    return availableQueues.filter(queue =>
      queue.name.toLowerCase().includes(query) ||
      queue.description.toLowerCase().includes(query)
    );
  }, [availableQueues, queueSearchQuery]);

  const handleSave = () => {
    if (!name.trim() || !criteria.trim()) return;

    const group: UserGroup = {
      id: isNew ? Date.now().toString() : (id || Date.now().toString()),
      name,
      description,
      eligibilityCriteria: criteria,
      associatedQueueIds,
      lastUpdated: new Date().toISOString()
    };

    saveUserGroup(group);
    navigate('/user-groups');
  };

  const handleBack = () => {
    navigate('/user-groups');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleRemoveQueue = (queueId: string) => {
    setAssociatedQueueIds(prev => prev.filter(id => id !== queueId));
  };

  const openQueueModal = () => {
    setTempSelectedQueues([]);
    setQueueSearchQuery('');
    setShowQueueModal(true);
  };

  const handleToggleQueue = (queueId: string) => {
    setTempSelectedQueues(prev =>
      prev.includes(queueId)
        ? prev.filter(id => id !== queueId)
        : [...prev, queueId]
    );
  };

  const handleSaveQueues = () => {
    setAssociatedQueueIds(prev => [...new Set([...prev, ...tempSelectedQueues])]);
    setShowQueueModal(false);
    setTempSelectedQueues([]);
    setQueueSearchQuery('');
  };

  const canSave = name.trim() && criteria.trim();


  return (
    <main className="main-content user-group-edit-page">
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
          <Link to="/user-groups" className="breadcrumb-link">User groups</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{isNew ? 'New' : name}</span>
        </div>
        <div className="title-with-back">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z" />
            </svg>
          </button>
          <h1 className="page-title">{isNew ? 'New user group' : name}</h1>
        </div>
        {!isNew && description && (
          <p className="page-description">{description}</p>
        )}
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Basic Details Card */}
        <div className="form-card">
          <h2 className="card-title">Basic details</h2>
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

        {/* Eligible Users Preview */}
        {showPreview && (
          <div className="form-card">
            <div className="card-header-with-badge">
              <h2 className="card-title">Eligible users</h2>
              <span className="count-badge">{eligibleUsers.length}</span>
            </div>
            <p className="eligible-users-subtext">
              This is only an indicative list of eligible users. These users may not be necessarily part of user group as the user eligibility will be determined in real-time during conversation run time.
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
                              <span key={skill} className="attribute-badge">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.language.map((lang) => (
                              <span key={lang} className="attribute-badge">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.region.map((reg) => (
                              <span key={reg} className="attribute-badge">
                                {reg}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.capacityProfile.map((cap) => (
                              <span key={cap} className="attribute-badge">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="badge-list">
                            {user.intent.map((int) => (
                              <span key={int} className="attribute-badge">
                                {int}
                              </span>
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
            <button className="add-queues-button" onClick={openQueueModal}>
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

      {/* Queue Selection Modal */}
      {showQueueModal && (
        <div className="modal-overlay" onClick={() => setShowQueueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select queues to map to this user group</h2>
              <button className="modal-close" onClick={() => setShowQueueModal(false)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-search">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search queues..."
                  className="modal-search-input"
                  value={queueSearchQuery}
                  onChange={(e) => setQueueSearchQuery(e.target.value)}
                />
              </div>

              {tempSelectedQueues.length > 0 && (
                <div className="selected-count">
                  Selected: <span className="selected-count-number">{tempSelectedQueues.length}</span>
                </div>
              )}

              <div className="queue-list">
                {filteredQueues.length === 0 ? (
                  <div className="queue-list-empty">
                    {availableQueues.length === 0
                      ? 'All queues are already associated with this group'
                      : 'No queues found matching your search'
                    }
                  </div>
                ) : (
                  filteredQueues.map((queue) => (
                    <label key={queue.id} className="queue-item">
                      <input
                        type="checkbox"
                        className="queue-checkbox"
                        checked={tempSelectedQueues.includes(queue.id)}
                        onChange={() => handleToggleQueue(queue.id)}
                      />
                      <div className="queue-item-content">
                        <div className="queue-item-header">
                          <span className="queue-item-name">{queue.name}</span>
                          <span className="type-badge">{queue.type}</span>
                        </div>
                        <p className="queue-item-description">{queue.description}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-button modal-button-cancel" onClick={() => setShowQueueModal(false)}>
                Cancel
              </button>
              <button
                className="modal-button modal-button-save"
                onClick={handleSaveQueues}
                disabled={tempSelectedQueues.length === 0}
              >
                Save association
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserGroupEdit;
