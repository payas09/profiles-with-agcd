import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserGroupById, saveUserGroup } from '../lib/userGroupStorage';
import { MOCK_USERS, MOCK_QUEUES } from '../lib/userGroupMockData';
import { getEligibleUsers, EXAMPLE_CRITERIA } from '../lib/userGroupEligibility';
import type { UserGroup, UserGroupType } from '../lib/userGroupTypes';
import UserFilterSidecar, { Filters } from './UserFilterSidecar';
import QueueSelectionSidecar from './QueueSelectionSidecar';
import './UserGroupEdit.css';

const emptyFilters: Filters = {
  skills: [],
  language: [],
  region: [],
  capacityProfile: [],
  intent: []
};

const UserGroupEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // Basic fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Group type
  const [groupType, setGroupType] = useState<UserGroupType>('static');

  // Dynamic group fields
  const [criteria, setCriteria] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Static group fields - filters and selection
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showFilterSidecar, setShowFilterSidecar] = useState(false);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [nameSearch, setNameSearch] = useState('');

  // Queue fields
  const [associatedQueueIds, setAssociatedQueueIds] = useState<string[]>([]);
  const [showQueueSidecar, setShowQueueSidecar] = useState(false);

  // Tracking
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalGroup, setOriginalGroup] = useState<UserGroup | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const group = getUserGroupById(id);
      if (group) {
        setName(group.name);
        setDescription(group.description);
        setGroupType(group.type || 'dynamic');
        setAssociatedQueueIds(group.associatedQueueIds);
        setOriginalGroup(group);

        if (group.type === 'dynamic' || !group.type) {
          setCriteria(group.eligibilityCriteria || '');
          setShowPreview(true);
        } else {
          setSelectedUserIds(group.memberUserIds || []);
        }
      }
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && originalGroup) {
      const changed =
        name !== originalGroup.name ||
        description !== originalGroup.description ||
        groupType !== (originalGroup.type || 'dynamic') ||
        (groupType === 'dynamic' && criteria !== originalGroup.eligibilityCriteria) ||
        (groupType === 'static' && JSON.stringify(selectedUserIds) !== JSON.stringify(originalGroup.memberUserIds || [])) ||
        JSON.stringify(associatedQueueIds) !== JSON.stringify(originalGroup.associatedQueueIds);
      setHasUnsavedChanges(changed);
    } else if (isNew) {
      setHasUnsavedChanges(
        name.trim() !== '' ||
        description.trim() !== '' ||
        (groupType === 'dynamic' && criteria.trim() !== '') ||
        (groupType === 'static' && selectedUserIds.length > 0) ||
        associatedQueueIds.length > 0
      );
    }
  }, [name, description, groupType, criteria, selectedUserIds, associatedQueueIds, originalGroup, isNew]);

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  // Filtered users based on applied filters (returns all if no filters)
  const filteredUsers = useMemo(() => {
    let users = MOCK_USERS;

    // Apply attribute filters if any
    if (hasActiveFilters) {
      users = users.filter(user => {
        if (filters.skills.length > 0) {
          const hasMatch = filters.skills.some(skill => user.skills.includes(skill));
          if (!hasMatch) return false;
        }

        if (filters.language.length > 0) {
          const hasMatch = filters.language.some(lang => user.language.includes(lang));
          if (!hasMatch) return false;
        }

        if (filters.region.length > 0) {
          const hasMatch = filters.region.some(reg => {
            return user.region.some(userReg =>
              userReg === reg ||
              userReg.toLowerCase().includes(reg.toLowerCase()) ||
              reg.toLowerCase().includes(userReg.toLowerCase())
            );
          });
          if (!hasMatch) return false;
        }

        if (filters.capacityProfile.length > 0) {
          const hasMatch = filters.capacityProfile.some(cap => user.capacityProfile.includes(cap));
          if (!hasMatch) return false;
        }

        if (filters.intent.length > 0) {
          const hasMatch = filters.intent.some(int => user.intent.includes(int));
          if (!hasMatch) return false;
        }

        return true;
      });
    }

    // Apply name search
    if (nameSearch.trim()) {
      const searchLower = nameSearch.toLowerCase();
      users = users.filter(user => user.name.toLowerCase().includes(searchLower));
    }

    return users;
  }, [filters, hasActiveFilters, nameSearch]);

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, nameSearch]);

  // Eligible users for dynamic groups
  const eligibleUsers = useMemo(() => {
    if (!criteria) return [];
    return getEligibleUsers(MOCK_USERS, criteria);
  }, [criteria]);

  // Selected users objects (for display in "Group members" section)
  const selectedUsers = useMemo(() => {
    return MOCK_USERS.filter(user => selectedUserIds.includes(user.id));
  }, [selectedUserIds]);

  const associatedQueues = useMemo(() => {
    return MOCK_QUEUES.filter(q => associatedQueueIds.includes(q.id));
  }, [associatedQueueIds]);

  const availableQueues = useMemo(() => {
    return MOCK_QUEUES.filter(q => !associatedQueueIds.includes(q.id));
  }, [associatedQueueIds]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (groupType === 'dynamic' && !criteria.trim()) return;
    if (groupType === 'static' && selectedUserIds.length === 0) return;

    const group: UserGroup = {
      id: isNew ? Date.now().toString() : (id || Date.now().toString()),
      name,
      description,
      type: groupType,
      associatedQueueIds,
      lastUpdated: new Date().toISOString()
    };

    if (groupType === 'dynamic') {
      group.eligibilityCriteria = criteria;
    } else {
      group.memberUserIds = selectedUserIds;
    }

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

  const handleAddQueues = (queueIds: string[]) => {
    setAssociatedQueueIds(prev => [...new Set([...prev, ...queueIds])]);
    setShowQueueSidecar(false);
  };

  // Filter handlers
  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  // User selection handlers
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select/deselect all users on current page
  const handleSelectAllOnPage = () => {
    const pageUserIds = paginatedUsers.map(u => u.id);
    const allPageSelected = pageUserIds.every(id => selectedUserIds.includes(id));

    if (allPageSelected) {
      // Deselect all on page
      setSelectedUserIds(prev => prev.filter(id => !pageUserIds.includes(id)));
    } else {
      // Select all on page
      setSelectedUserIds(prev => [...new Set([...prev, ...pageUserIds])]);
    }
  };

  // Select all matching users (all filtered results)
  const handleSelectAllMatching = () => {
    const allMatchingIds = filteredUsers.map(u => u.id);
    setSelectedUserIds(prev => [...new Set([...prev, ...allMatchingIds])]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const handleClearAllUsers = () => {
    setSelectedUserIds([]);
  };

  // Check if all users on current page are selected
  const allPageSelected = paginatedUsers.length > 0 &&
    paginatedUsers.every(user => selectedUserIds.includes(user.id));

  // Check if all matching users are selected
  const allMatchingSelected = filteredUsers.length > 0 &&
    filteredUsers.every(user => selectedUserIds.includes(user.id));

  // Count how many on current page are selected
  const selectedOnPageCount = paginatedUsers.filter(u => selectedUserIds.includes(u.id)).length;

  const canSave = name.trim() && (
    (groupType === 'dynamic' && criteria.trim()) ||
    (groupType === 'static' && selectedUserIds.length > 0)
  );

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
        {/* Group Type Selection Card */}
        <div className="form-card">
          <h2 className="card-title">Group type</h2>
          <div className="group-type-options">
            <label className="group-type-option">
              <input
                type="radio"
                name="groupType"
                value="static"
                checked={groupType === 'static'}
                onChange={() => setGroupType('static')}
              />
              <div className="group-type-content">
                <span className="group-type-label">Static User Group</span>
                <span className="group-type-description">Manually select specific users to add to this group</span>
              </div>
            </label>
            <label className="group-type-option group-type-disabled">
              <input
                type="radio"
                name="groupType"
                value="dynamic"
                checked={groupType === 'dynamic'}
                disabled
              />
              <div className="group-type-content">
                <span className="group-type-label">
                  Dynamic User Group
                  <span className="coming-soon-badge">Coming soon</span>
                </span>
                <span className="group-type-description">Automatically include users based on eligibility criteria</span>
              </div>
            </label>
          </div>
        </div>

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

        {/* Static Group: Find and Select Users */}
        {groupType === 'static' && (
          <>
            {/* Filter and User Selection Card */}
            <div className="form-card">
              <div className="card-header-with-actions">
                <div className="card-header-left">
                  <h2 className="card-title">Add users</h2>
                  <button className="filter-button-main" onClick={() => setShowFilterSidecar(true)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {hasActiveFilters ? 'Edit filters' : 'Add filters'}
                    {hasActiveFilters && (
                      <span className="filter-badge">{Object.values(filters).flat().length}</span>
                    )}
                  </button>
                </div>
                <div className="card-header-right">
                  <div className="selected-count-display">
                    <span className="selected-count-number">{selectedUserIds.length}</span>
                    <span className="selected-count-text">user{selectedUserIds.length !== 1 ? 's' : ''} selected</span>
                  </div>
                </div>
              </div>

              {/* Search and Table Header */}
              <div className="users-toolbar">
                <div className="users-search-box">
                  <svg className="users-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 15l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    className="users-search-input"
                    placeholder="Search users by name..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                  {nameSearch && (
                    <button className="users-search-clear" onClick={() => setNameSearch('')}>
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="users-count-info">
                  {hasActiveFilters || nameSearch ? (
                    <span>Showing {startIndex + 1}-{endIndex} of {totalUsers} users</span>
                  ) : (
                    <span>Showing {startIndex + 1}-{endIndex} of {totalUsers} users (all)</span>
                  )}
                </div>
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="empty-message">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="20" stroke="#e1dfdd" strokeWidth="2" />
                      <path d="M18 18l12 12M30 18l-12 12" stroke="#e1dfdd" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="empty-title">No users found</p>
                  <p className="empty-text">Try adjusting your filters or search to find users</p>
                </div>
              ) : (
                <>
                  <div className="users-table-container">
                    <table className="users-table selectable-table">
                      <thead>
                        <tr>
                          <th className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={allPageSelected}
                              onChange={handleSelectAllOnPage}
                              title="Select all on this page"
                            />
                          </th>
                          <th>Name</th>
                          <th>Skills</th>
                          <th>Language</th>
                          <th>Region</th>
                          <th>Capacity Profile</th>
                          <th>Intent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={selectedUserIds.includes(user.id) ? 'row-selected' : ''}
                            onClick={() => handleToggleUser(user.id)}
                          >
                            <td className="checkbox-column">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => handleToggleUser(user.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination and Selection Controls */}
                  <div className="users-table-footer">
                    <div className="selection-controls">
                      <div className="total-selection-summary">
                        <span className="total-selected-badge">{selectedUserIds.length}</span>
                        <span className="total-selected-label">user{selectedUserIds.length !== 1 ? 's' : ''} selected for this group</span>
                        {selectedUserIds.length > 0 && (
                          <button className="clear-selection-button" onClick={handleClearAllUsers}>
                            Clear
                          </button>
                        )}
                      </div>
                      {!allMatchingSelected && totalUsers > itemsPerPage && (
                        <button className="select-all-matching-button" onClick={handleSelectAllMatching}>
                          Select all {totalUsers} users
                        </button>
                      )}
                    </div>

                    <div className="pagination-controls">
                      <div className="items-per-page">
                        <label>Show:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <div className="page-navigation">
                        <button
                          className="page-nav-button"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                          Prev
                        </button>
                        <span className="page-info">Page {currentPage} of {totalPages || 1}</span>
                        <button
                          className="page-nav-button"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                          <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Dynamic Group: Eligibility Criteria */}
        {groupType === 'dynamic' && (
          <>
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
          </>
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

      {/* Filter Sidecar */}
      <UserFilterSidecar
        isOpen={showFilterSidecar}
        onClose={() => setShowFilterSidecar(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

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

export default UserGroupEdit;
