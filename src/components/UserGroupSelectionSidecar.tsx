import React, { useState, useMemo, useEffect } from 'react';
import type { UserGroup, UserProfile } from '../lib/userGroupTypes';
import { getEligibleUsers } from '../lib/userGroupEligibility';
import './UserGroupSelectionSidecar.css';

interface UserGroupSelectionSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedGroupIds: string[]) => void;
  allUserGroups: UserGroup[];
  initialSelectedIds: string[];
  queueName: string;
  mode: 'add' | 'view';
  mockUsers: UserProfile[];
}

const UserGroupSelectionSidecar: React.FC<UserGroupSelectionSidecarProps> = ({
  isOpen,
  onClose,
  onSave,
  allUserGroups,
  initialSelectedIds,
  queueName,
  mode,
  mockUsers
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when sidecar opens or initialSelectedIds change
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setSearchQuery('');
    }
  }, [isOpen, initialSelectedIds]);

  // In "view" mode, show only currently associated groups
  // In "add" mode, show groups not yet associated (available to add)
  // Only show static user groups
  const displayGroups = useMemo(() => {
    // Filter to only static user groups
    const staticGroups = allUserGroups.filter(g => g.type === 'static' || !g.type);

    let groups: UserGroup[];
    if (mode === 'view') {
      groups = staticGroups.filter(g => selectedIds.includes(g.id));
    } else {
      // Add mode: show all static groups, but highlight which are already selected
      groups = staticGroups;
    }

    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query)
    );
  }, [allUserGroups, selectedIds, searchQuery, mode]);

  const getUsersForGroup = (group: UserGroup): UserProfile[] => {
    if (group.type === 'static') {
      return mockUsers.filter(u => group.memberUserIds?.includes(u.id));
    }
    // Dynamic group
    if (!group.eligibilityCriteria) return mockUsers;
    return getEligibleUsers(mockUsers, group.eligibilityCriteria);
  };

  const getUserCountDisplay = (group: UserGroup): string => {
    const users = getUsersForGroup(group);
    return `${users.length} member${users.length !== 1 ? 's' : ''}`;
  };

  const getUserNamesPreview = (group: UserGroup): string => {
    const users = getUsersForGroup(group);
    const maxShow = 3;
    const names = users.slice(0, maxShow).map(u => u.name);
    if (users.length > maxShow) {
      names.push(`+${users.length - maxShow} more`);
    }
    return names.join(', ');
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== groupId));
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (!isOpen) return null;

  const hasChanges = JSON.stringify([...initialSelectedIds].sort()) !== JSON.stringify([...selectedIds].sort());
  const title = mode === 'view' ? 'Associated user groups' : 'Add user groups';
  const description = mode === 'view'
    ? `User groups currently associated with ${queueName}. Remove groups to update associations.`
    : `Select user groups to associate with ${queueName}. Associated groups will have their users eligible to receive work from this queue.`;

  return (
    <>
      <div className="usergroup-sidecar-overlay" onClick={onClose} />
      <div className="usergroup-sidecar-panel">
        <div className="usergroup-sidecar-header">
          <h2 className="usergroup-sidecar-title">{title}</h2>
          <button type="button" className="usergroup-sidecar-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        <div className="usergroup-sidecar-body">
          <div className="usergroup-sidecar-intro">
            <p>{description}</p>
          </div>

          <div className="usergroup-search-box">
            <svg className="usergroup-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
            </svg>
            <input
              type="text"
              className="usergroup-search-input"
              placeholder="Search user groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="usergroup-search-clear" onClick={handleClearSearch}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 4.586L2.707 1.293 1.293 2.707 4.586 6 1.293 9.293l1.414 1.414L6 7.414l3.293 3.293 1.414-1.414L7.414 6l3.293-3.293-1.414-1.414L6 4.586z" />
                </svg>
              </button>
            )}
          </div>

          <div className="usergroup-selection-header">
            <span className="usergroup-count">
              {displayGroups.length} user group{displayGroups.length !== 1 ? 's' : ''}
              {mode === 'add' && selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
            </span>
          </div>

          <div className="usergroup-table-container">
            {displayGroups.length === 0 ? (
              <div className="usergroup-empty-state">
                {searchQuery
                  ? `No user groups matching "${searchQuery}"`
                  : mode === 'view'
                    ? 'No user groups associated with this queue'
                    : 'No user groups available'}
              </div>
            ) : (
              <table className="usergroup-table">
                <thead>
                  <tr>
                    {mode === 'add' && <th className="usergroup-th-checkbox"></th>}
                    <th className="usergroup-th-name">Name</th>
                    <th className="usergroup-th-description">Description</th>
                    <th className="usergroup-th-users">Users</th>
                    {mode === 'view' && <th className="usergroup-th-actions"></th>}
                  </tr>
                </thead>
                <tbody>
                  {displayGroups.map(group => {
                    const isSelected = selectedIds.includes(group.id);
                    return (
                      <tr
                        key={group.id}
                        className={`usergroup-row ${isSelected ? 'usergroup-row-selected' : ''}`}
                        onClick={mode === 'add' ? () => handleToggleGroup(group.id) : undefined}
                      >
                        {mode === 'add' && (
                          <td className="usergroup-td-checkbox">
                            <input
                              type="checkbox"
                              className="usergroup-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleGroup(group.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="usergroup-td-name">
                          <span className="usergroup-name">{group.name}</span>
                        </td>
                        <td className="usergroup-td-description">
                          <span className="usergroup-description">
                            {group.description || '—'}
                          </span>
                        </td>
                        <td className="usergroup-td-users">
                          <div className="usergroup-users-info">
                            <span className="usergroup-users-count">{getUserCountDisplay(group)}</span>
                            <span className="usergroup-users-preview">{getUserNamesPreview(group)}</span>
                          </div>
                        </td>
                        {mode === 'view' && (
                          <td className="usergroup-td-actions">
                            <button
                              type="button"
                              className="usergroup-remove-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveGroup(group.id);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                              </svg>
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="usergroup-sidecar-footer">
          <button type="button" className="usergroup-btn usergroup-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="usergroup-btn usergroup-btn-save"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default UserGroupSelectionSidecar;
