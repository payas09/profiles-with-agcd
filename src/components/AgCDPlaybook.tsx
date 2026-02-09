import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AgCDPlaybook.css';
import { getAllPrompts, getProfileDisplayText, deletePrompt, duplicatePrompt, PromptData } from '../utils/promptStorage';

const AgCDPlaybook: React.FC = () => {
  const navigate = useNavigate();
  const [activePageTab, setActivePageTab] = useState<'home' | 'playbook'>('playbook');
  const [activeFilter, setActiveFilter] = useState<'all' | 'orchestrator' | 'assignment'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    setPrompts(getAllPrompts());
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
      alert('Policy duplicated successfully!');
    }
  };

  const handleDelete = (policyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    if (confirm('Are you sure you want to delete this policy?')) {
      deletePrompt(policyId);
      loadPrompts();
    }
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

  const handleProfileClick = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/engagement-profile/${profileId}`);
  };

  const renderProfiles = (policy: PromptData) => {
    if (policy.selectionMode === 'all') {
      return (
        <span className="profile-tag-item">
          All Engagement profiles
        </span>
      );
    } else if (policy.selectedProfiles.length > 0) {
      if (expandedRows.has(policy.id)) {
        return (
          <div className="profiles-expanded-list">
            {policy.selectionMode === 'except' && (
              <span className="profile-display-text-small">
                All except:
              </span>
            )}
            {policy.selectedProfiles.map((profile, index) => (
              <span
                key={index}
                className="profile-tag-item profile-tag-clickable"
                onClick={(e) => handleProfileClick(profile.profileId, e)}
              >
                {profile.profileName}
              </span>
            ))}
            <button
              className="profile-toggle-btn"
              onClick={(e) => toggleExpandRow(policy.id, e)}
            >
              Show less
            </button>
          </div>
        );
      } else {
        return (
          <>
            {policy.selectionMode === 'except' && (
              <span className="profile-display-text-small">
                All except:{' '}
              </span>
            )}
            <span
              className="profile-tag-item profile-tag-clickable"
              onClick={(e) => handleProfileClick(policy.selectedProfiles[0].profileId, e)}
            >
              {policy.selectedProfiles[0].profileName}
            </span>
            {policy.selectedProfiles.length > 1 && (
              <button
                className="profile-more-count"
                onClick={(e) => toggleExpandRow(policy.id, e)}
              >
                +{policy.selectedProfiles.length - 1} more
              </button>
            )}
          </>
        );
      }
    }
    return <span className="no-profile-text">No profiles</span>;
  };

  return (
    <main className="main-content agcd-playbook-page">
      <div className="playbook-page-wrapper">
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

        <div className="playbook-content-wrapper">
        {/* Breadcrumb */}
        <div className="playbook-breadcrumb">
          <Link to="/agcd" className="breadcrumb-link-style">Orchestration Agent</Link>
          <svg className="breadcrumb-sep" width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <path d="M2 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="breadcrumb-active">Playbook</span>
        </div>

        {/* Page Header */}
        <div className="playbook-page-header">
          <div className="header-title-badge">
            <h1 className="playbook-page-title">Orchestration Agent (Preview)</h1>
            <span className="preview-badge-style">Preview: Testing</span>
          </div>
          <p className="playbook-page-desc">
            View and manage all your routing policies. Create policies to control routing patterns, working hours, assignment logic, and automated actions.
          </p>
        </div>

        {/* Filters Card */}
        <div className="filters-card">
          <h3 className="filters-card-title">Filters</h3>
          <div className="filter-pills-container">
            <button
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-pill ${activeFilter === 'orchestrator' ? 'active' : ''}`}
              onClick={() => setActiveFilter('orchestrator')}
            >
              Orchestrator
            </button>
            <button
              className={`filter-pill ${activeFilter === 'assignment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('assignment')}
            >
              Assignment
            </button>
          </div>
        </div>

        {/* Search and New Policy Button */}
        <div className="search-and-new-container">
          <div className="search-box-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search policies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="new-policy-button" onClick={() => navigate('/agcd')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
            </svg>
            New policy
          </button>
        </div>

        {/* Policies Table */}
        <div className="policies-table-wrapper">
          <table className="policies-data-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Profiles</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <span
                        className="policy-name-link-text"
                        onClick={() => handlePolicyClick(policy.id)}
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
                    <td>
                      <div className="profiles-display-cell">
                        {renderProfiles(policy)}
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
                              onClick={() => handleDelete(policy.id)}
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
                  <td colSpan={6} className="no-results-text">
                    No policies found. Create a new policy from the Home tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredPolicies.length > 0 && (
          <div className="table-results-footer">
            <span className="results-count-text">{filteredPolicies.length} of {prompts.length}</span>
          </div>
        )}
        </div>
      </div>
    </main>
  );
};

export default AgCDPlaybook;
