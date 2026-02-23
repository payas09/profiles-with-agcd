import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserGroups, deleteUserGroup } from '../lib/userGroupStorage';
import { MOCK_USERS } from '../lib/userGroupMockData';
import { getEligibleUsers } from '../lib/userGroupEligibility';
import type { UserGroup } from '../lib/userGroupTypes';
import './UserGroups.css';

const UserGroups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    setGroups(getUserGroups());
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const query = searchQuery.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const getEligibleCount = (criteria: string) => {
    if (!criteria) return MOCK_USERS.length;
    return getEligibleUsers(MOCK_USERS, criteria).length;
  };

  const getQueueCount = (group: UserGroup) => {
    return group.associatedQueueIds.length;
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteClick = (group: UserGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
    setActiveMenu(null);
  };

  const handleEditClick = (group: UserGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user-group/${group.id}`);
  };

  const confirmDelete = () => {
    if (groupToDelete) {
      deleteUserGroup(groupToDelete.id);
      setGroups(getUserGroups());
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleRowClick = (group: UserGroup) => {
    navigate(`/user-group/${group.id}`);
  };

  const toggleMenu = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === groupId ? null : groupId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  return (
    <main className="main-content user-groups-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <Link to="/user-group/new" className="add-button-toolbar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New
          </Link>
        </div>
        <div className="toolbar-right">
          <div className="search-box-toolbar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
            </svg>
            <input
              type="text"
              placeholder="Search user groups"
              className="search-input-toolbar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="content-header">
        <h1 className="page-title">User groups</h1>
        <p className="page-description">
          Define conditional eligibility boundaries for routing conversations to users. User groups enable dynamic membership based on user attributes like skills, language, region, and capacity profile.
        </p>
      </div>

      {filteredGroups.length === 0 && searchQuery && (
        <div className="empty-state">
          <p className="empty-state-text">No user groups found matching "{searchQuery}"</p>
        </div>
      )}

      {filteredGroups.length === 0 && !searchQuery && groups.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">No user groups yet</p>
          <p className="empty-state-text">
            Create your first user group to define eligibility criteria for routing
          </p>
          <Link to="/user-group/new" className="empty-state-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Create user group
          </Link>
        </div>
      )}

      {filteredGroups.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    Name
                    <svg className="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 3l3 4H3l3-4z" />
                    </svg>
                  </div>
                </th>
                <th>Description</th>
                <th>Eligibility Criteria</th>
                <th>Eligible Users</th>
                <th>Associated Queues</th>
                <th>Last Updated</th>
                <th className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id} onClick={() => handleRowClick(group)} className="clickable-row">
                  <td>
                    <span className="table-link">{group.name}</span>
                  </td>
                  <td>{group.description ? truncate(group.description, 50) : '—'}</td>
                  <td>{truncate(group.eligibilityCriteria || 'No criteria defined', 60)}</td>
                  <td>
                    <span className="count-badge">{getEligibleCount(group.eligibilityCriteria)}</span>
                  </td>
                  <td>
                    <span className="count-badge">{getQueueCount(group)}</span>
                  </td>
                  <td>{formatDate(group.lastUpdated)}</td>
                  <td className="actions-column" onClick={(e) => e.stopPropagation()}>
                    <div className="action-menu-container">
                      <button
                        className="action-menu-button"
                        onClick={(e) => toggleMenu(group.id, e)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>
                      {activeMenu === group.id && (
                        <div className="action-dropdown-menu">
                          <button
                            className="dropdown-menu-item"
                            onClick={(e) => handleEditClick(group, e)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M12.854 1.146a.5.5 0 0 0-.708 0L3 10.293V13h2.707l9.147-9.146a.5.5 0 0 0 0-.708l-2-2z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="dropdown-menu-item dropdown-menu-item-danger"
                            onClick={(e) => handleDeleteClick(group, e)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                            Delete
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
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="dialog-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">Delete user group?</h2>
            <p className="dialog-description">
              This action cannot be undone. This will permanently delete the user group "{groupToDelete?.name}".
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-button dialog-button-cancel"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="dialog-button dialog-button-danger"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserGroups;
