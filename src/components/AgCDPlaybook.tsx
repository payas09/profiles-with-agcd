import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AgCDPlaybook.css';
import { getAllPrompts, deletePrompt, duplicatePrompt, PromptData } from '../utils/promptStorage';

// Trigger display mapping
const triggerDisplayMap: { [key: string]: string } = {
  'conversation-waiting': 'Conversation is waiting in queue',
  'conversation-transferred': 'Conversation is transferred to the queue',
  'work-item-unassigned': 'Conversation is waiting in queue',
  'conversation-started': 'Conversation Started',
  'wait-time-exceeds': 'Wait time exceeds',
  'work-item-transferred': 'Work item is transferred'
};

const getTriggerDisplayName = (trigger: string | undefined, scenarioId?: string): string => {
  // Fix trigger based on scenarioId for existing playbooks with incorrect trigger
  if (scenarioId === 'queue-transfer-escalation') {
    return triggerDisplayMap['conversation-transferred'];
  }
  if (scenarioId === 'wait-time-escalation') {
    return triggerDisplayMap['conversation-waiting'];
  }
  if (!trigger) return 'Conversation is waiting in queue';
  return triggerDisplayMap[trigger] || trigger.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const AgCDPlaybook: React.FC = () => {
  const navigate = useNavigate();
  const [activePageTab, setActivePageTab] = useState<'home' | 'playbook'>('playbook');
  const [activeFilter, setActiveFilter] = useState<'all' | 'orchestrator' | 'assignment'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playBookToDelete, setPlayBookToDelete] = useState<PromptData | null>(null);

  // Find the most recently saved playbook (for "New" tag)
  const mostRecentPlaybookId = useMemo(() => {
    if (prompts.length === 0) return null;
    const withTimestamp = prompts.filter(p => p.updatedAt || p.createdAt);
    if (withTimestamp.length === 0) return null;
    const mostRecent = withTimestamp.reduce((latest, current) => {
      const currentTime = current.updatedAt || current.createdAt || 0;
      const latestTime = latest.updatedAt || latest.createdAt || 0;
      return currentTime > latestTime ? current : latest;
    });
    // Only show "New" if saved within last 24 hours
    const oneDayMs = 24 * 60 * 60 * 1000;
    const mostRecentTime = mostRecent.updatedAt || mostRecent.createdAt;
    if (mostRecentTime && (Date.now() - mostRecentTime) < oneDayMs) {
      return mostRecent.id;
    }
    return null;
  }, [prompts]);

  // Load prompts on mount and when navigating back
  useEffect(() => {
    loadPrompts();
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

  const loadPrompts = () => {
    // Only show playbooks created in regular "Agentic routing" flow (not public preview)
    const allPrompts = getAllPrompts();
    const filteredPrompts = allPrompts.filter(p => !p.isPublicPreview);
    setPrompts(filteredPrompts);
  };

  const filteredPolicies = prompts.filter(policy => {
    // Filter by type
    let matchesFilter = true;
    if (activeFilter === 'orchestrator') matchesFilter = policy.type === 'Orchestrator';
    else if (activeFilter === 'assignment') matchesFilter = policy.type === 'Assignment';

    // Filter by search query
    const matchesSearch = searchQuery === '' ||
      policy.promptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.selectedTrigger && policy.selectedTrigger.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handlePolicyClick = (policyId: string) => {
    navigate(`/agcd/policy/${policyId}`);
  };

  const handleEdit = (policyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    navigate(`/agcd/policy/${policyId}`);
  };

  const handleDuplicate = (policyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    const newId = duplicatePrompt(policyId);
    if (newId) {
      loadPrompts();
      alert('Playbook duplicated successfully!');
    }
  };

  const handleDelete = (policy: PromptData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    setPlayBookToDelete(policy);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (playBookToDelete) {
      deletePrompt(playBookToDelete.id);
      loadPrompts();
    }
    setShowDeleteConfirm(false);
    setPlayBookToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPlayBookToDelete(null);
  };

  const toggleMenu = (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === policyId ? null : policyId);
  };

  const handlePageTabChange = (tab: 'home' | 'playbook') => {
    setActivePageTab(tab);
    if (tab === 'home') {
      navigate('/agcd');
    }
  };

  const toggleExpandRow = (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      return newSet;
    });
  };

  const renderProfiles = (policy: PromptData) => {
    // Use selectedProfiles which contains profile data
    const profiles = policy.selectedProfiles || [];

    if (policy.selectionMode === 'all') {
      return (
        <span className="queue-tag-item">
          All Profiles
        </span>
      );
    } else if (profiles.length > 0) {
      if (expandedRows.has(policy.id + '-profiles')) {
        return (
          <div className="queues-expanded-list">
            {policy.selectionMode === 'except' && (
              <span className="queue-display-text-small">
                All except:
              </span>
            )}
            {profiles.map((profile, index) => (
              <span
                key={index}
                className="queue-tag-item"
              >
                {profile.profileName}
              </span>
            ))}
            <button
              className="queue-toggle-btn"
              onClick={(e) => toggleExpandRow(policy.id + '-profiles', e)}
            >
              Show less
            </button>
          </div>
        );
      } else {
        return (
          <>
            {policy.selectionMode === 'except' && (
              <span className="queue-display-text-small">
                All except:{' '}
              </span>
            )}
            <span className="queue-tag-item">
              {profiles[0].profileName}
            </span>
            {profiles.length > 1 && (
              <button
                className="queue-more-count"
                onClick={(e) => toggleExpandRow(policy.id + '-profiles', e)}
              >
                +{profiles.length - 1} more
              </button>
            )}
          </>
        );
      }
    }
    // Default to "All Profiles" since profiles are mandatory
    return (
      <span className="queue-tag-item">
        All Profiles
      </span>
    );
  };

  const renderChannels = (policy: PromptData) => {
    // Use selectedChannel which is a single channel value (Voice or Messaging)
    const channel = policy.selectedChannel || 'Voice';

    return (
      <span className="channel-tag-item">
        {channel}
      </span>
    );
  };

  return (
    <main className="main-content agcd-playbook-page">
      <div className="playbook-page-wrapper">
        {/* Breadcrumb and Tab Switcher Row */}
        <div className="agcd-top-row">
          <nav className="agcd-breadcrumb">
            <span className="breadcrumb-item">Conversation orchestration (Preview)</span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-item current">All playbooks</span>
          </nav>
          {/* Tab Switcher */}
          <div className="agcd-tab-switcher">
            <button
              className={`agcd-tab-button ${activePageTab === 'home' ? 'active' : ''}`}
              onClick={() => handlePageTabChange('home')}
            >
              New
            </button>
            <button
              className={`agcd-tab-button ${activePageTab === 'playbook' ? 'active' : ''}`}
              onClick={() => handlePageTabChange('playbook')}
            >
              All playbooks
            </button>
          </div>
        </div>

        <div className="playbook-content-wrapper">
        {/* Page Header */}
        <div className="playbook-page-header">
          <div className="header-title-badge">
            <h1 className="playbook-page-title">Conversation orchestration</h1>
            <span className="preview-badge-style">Preview</span>
            <span className="badge-gen-ai">Gen AI</span>
          </div>
          <p className="playbook-page-desc">
            Conversation orchestration is an AI-powered capability that manages the entire conversation lifecycle by continuously evaluating triggers and applying business logic in real time. AI generated content may be inaccurate. <a href="#" className="learn-more-link">Learn more</a>
          </p>
        </div>

        {/* Search and New Playbook Button */}
        <div className="search-and-new-container">
          <div className="search-box-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search playbooks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons-container">
            <button className="new-playbook-button" onClick={() => navigate('/agcd')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
              </svg>
              New playbook
            </button>
            <div className="view-toggle-buttons">
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 3h12v1.5H2V3zm0 4h12v1.5H2V7zm0 4h12v1.5H2V11z"/>
                </svg>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Playbooks List View */}
        {viewMode === 'list' && (
          <div className="playbooks-table-wrapper">
            <table className="playbooks-data-table">
              <thead>
                <tr>
                  <th>Playbook Name</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Profiles</th>
                  <th>Channels</th>
                  <th>Last Modified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.length > 0 ? (
                  filteredPolicies.map((policy) => (
                    <tr key={policy.id}>
                      <td>
                        <div className="playbook-name-with-content">
                          <div className="playbook-name-cell">
                            <span
                              className="playbook-name-link-text"
                              onClick={() => handlePolicyClick(policy.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {policy.promptName}
                            </span>
                            {mostRecentPlaybookId === policy.id && (
                              <span className="new-playbook-tag">New</span>
                            )}
                          </div>
                          {policy.policyBehavior && (
                            <div className="playbook-content-preview">
                              {policy.policyBehavior}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="trigger-column-text">
                        {getTriggerDisplayName(policy.selectedTrigger, policy.scenarioId)}
                      </td>
                      <td>
                        <span className={`status-pill ${policy.status.toLowerCase()}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="queues-display-cell">
                        <div className="queues-display-wrapper">
                          {renderProfiles(policy)}
                        </div>
                      </td>
                      <td className="channels-display-cell">
                        <div className="channels-display-wrapper">
                          {renderChannels(policy)}
                        </div>
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
                                onClick={() => handleEdit(policy.id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 2.987 11.574a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064l6.763-6.763z"/>
                                </svg>
                                Edit
                              </button>
                              <button
                                className="dropdown-menu-item"
                                onClick={() => handleDuplicate(policy.id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1h1v1a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2h1v1H2z"/>
                                </svg>
                                Duplicate
                              </button>
                              <button
                                className="dropdown-menu-item dropdown-menu-item-danger"
                                onClick={() => handleDelete(policy)}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                                  <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="no-results-text">
                      No playbooks found. Create a new playbook from the Home tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Playbooks Grid View */}
        {viewMode === 'grid' && (
          <div className="playbooks-grid-container">
            {filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy) => (
                <div key={policy.id} className="playbook-grid-card">
                  <div className="grid-card-header">
                    <div className="grid-card-title-header">
                      <span
                        className="playbook-name-link-text"
                        onClick={() => handlePolicyClick(policy.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {policy.promptName}
                      </span>
                      {mostRecentPlaybookId === policy.id && (
                        <span className="new-playbook-tag">New</span>
                      )}
                    </div>
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
                            onClick={() => handleEdit(policy.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 2.987 11.574a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064l6.763-6.763z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            className="dropdown-menu-item"
                            onClick={() => handleDuplicate(policy.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1h1v1a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2h1v1H2z"/>
                            </svg>
                            Duplicate
                          </button>
                          <button
                            className="dropdown-menu-item dropdown-menu-item-danger"
                            onClick={() => handleDelete(policy)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {policy.policyBehavior && (
                    <div className="grid-card-content">
                      {policy.policyBehavior}
                    </div>
                  )}
                  <div className="grid-card-field">
                    <span className="grid-field-label">Trigger</span>
                    <span className="grid-field-value">
                      {getTriggerDisplayName(policy.selectedTrigger, policy.scenarioId)}
                    </span>
                  </div>
                  <div className="grid-card-field">
                    <span className="grid-field-label">Status</span>
                    <span className={`status-pill ${policy.status.toLowerCase()}`}>
                      {policy.status}
                    </span>
                  </div>
                  <div className="grid-card-field">
                    <span className="grid-field-label">Last Modified</span>
                    <span className="grid-field-value">{policy.lastModified}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results-grid">
                No playbooks found. Create a new playbook from the Home tab.
              </div>
            )}
          </div>
        )}

        {/* Table Footer */}
        {filteredPolicies.length > 0 && (
          <div className="table-results-footer">
            <span className="results-count-text">{filteredPolicies.length} of {prompts.length}</span>
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && playBookToDelete && (
        <>
          <div className="publish-confirm-overlay" onClick={handleDeleteCancel}></div>
          <div className="publish-confirm-modal">
            <div className="publish-confirm-header">
              <h2 className="publish-confirm-title">Delete Playbook</h2>
              <button className="publish-confirm-close" onClick={handleDeleteCancel}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="publish-confirm-content">
              <p className="publish-confirm-message">
                Are you sure you want to delete the playbook "{playBookToDelete.promptName}"? This action cannot be undone.
              </p>
            </div>
            <div className="publish-confirm-footer">
              <button className="btn-secondary-action" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="btn-danger-action" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default AgCDPlaybook;
