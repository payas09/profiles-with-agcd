import React, { useState, useMemo } from 'react';
import { MOCK_USERS } from '../lib/userGroupMockData';
import { FLAT_FILTER_OPTIONS, HIERARCHICAL_FILTERS, TreeNode } from '../lib/userGroupTypes';
import type { UserProfile } from '../lib/userGroupTypes';
import './UserSelectionSidecar.css';

interface UserSelectionSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUsers: (userIds: string[]) => void;
  excludeUserIds: string[]; // Users already in the group
}

interface Filters {
  skills: string[];
  language: string[];
  region: string[];
  capacityProfile: string[];
  intent: string[];
}

const UserSelectionSidecar: React.FC<UserSelectionSidecarProps> = ({
  isOpen,
  onClose,
  onAddUsers,
  excludeUserIds
}) => {
  const [filters, setFilters] = useState<Filters>({
    skills: [],
    language: [],
    region: [],
    capacityProfile: [],
    intent: []
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  // Filter users based on selected filters (AND between types, OR within type)
  const filteredUsers = useMemo(() => {
    if (!hasActiveFilters) return [];

    return MOCK_USERS.filter(user => {
      // Exclude users already in the group
      if (excludeUserIds.includes(user.id)) return false;

      if (filters.skills.length > 0) {
        const hasMatch = filters.skills.some(skill => user.skills.includes(skill));
        if (!hasMatch) return false;
      }

      if (filters.language.length > 0) {
        const hasMatch = filters.language.some(lang => user.language.includes(lang));
        if (!hasMatch) return false;
      }

      if (filters.region.length > 0) {
        // Check if user's region matches any selected region (including parent matches)
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
  }, [filters, excludeUserIds, hasActiveFilters]);

  const handleFilterChange = (filterKey: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter(v => v !== value)
        : [...prev[filterKey], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      skills: [],
      language: [],
      region: [],
      capacityProfile: [],
      intent: []
    });
    setSelectedUserIds([]);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredUsers.map(u => u.id);
    const allSelected = allIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedUserIds(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleAddUsers = () => {
    onAddUsers(selectedUserIds);
    // Reset state
    setFilters({
      skills: [],
      language: [],
      region: [],
      capacityProfile: [],
      intent: []
    });
    setSelectedUserIds([]);
    setExpandedNodes(new Set());
  };

  const handleClose = () => {
    // Reset state on close
    setFilters({
      skills: [],
      language: [],
      region: [],
      capacityProfile: [],
      intent: []
    });
    setSelectedUserIds([]);
    setExpandedNodes(new Set());
    onClose();
  };

  // Check if all leaf nodes under a parent are selected
  const getLeafNodes = (node: TreeNode): string[] => {
    if (!node.children || node.children.length === 0) {
      return [node.id];
    }
    return node.children.flatMap(child => getLeafNodes(child));
  };

  const renderTreeNode = (node: TreeNode, filterKey: keyof Filters, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isLeaf = !hasChildren;
    const isSelected = filters[filterKey].includes(node.id);

    return (
      <div key={node.id} className="tree-node" style={{ paddingLeft: `${depth * 20}px` }}>
        <div className="tree-node-row">
          {hasChildren ? (
            <button className="tree-toggle" onClick={() => toggleNode(node.id)}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <span className="tree-toggle-spacer" />
          )}
          <label className="tree-node-label">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleFilterChange(filterKey, node.id)}
            />
            <span>{node.label}</span>
          </label>
        </div>
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children!.map(child => renderTreeNode(child, filterKey, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFlatDropdown = (filterKey: keyof Filters, label: string, options: readonly string[]) => {
    const isOpen = openDropdown === filterKey;
    const selectedCount = filters[filterKey].length;

    return (
      <div className="sidecar-filter-section">
        <div className="sidecar-filter-header" onClick={() => setOpenDropdown(isOpen ? null : filterKey)}>
          <span className="sidecar-filter-label">{label}</span>
          {selectedCount > 0 && <span className="sidecar-filter-count">{selectedCount}</span>}
          <svg
            className="sidecar-filter-chevron"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        {isOpen && (
          <div className="sidecar-filter-options">
            {options.map(option => (
              <label key={option} className="sidecar-filter-option">
                <input
                  type="checkbox"
                  checked={filters[filterKey].includes(option)}
                  onChange={() => handleFilterChange(filterKey, option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTreeFilter = (filterKey: 'language' | 'region', label: string) => {
    const isOpen = openDropdown === filterKey;
    const selectedCount = filters[filterKey].length;
    const treeData = HIERARCHICAL_FILTERS[filterKey];

    return (
      <div className="sidecar-filter-section">
        <div className="sidecar-filter-header" onClick={() => setOpenDropdown(isOpen ? null : filterKey)}>
          <span className="sidecar-filter-label">{label}</span>
          {selectedCount > 0 && <span className="sidecar-filter-count">{selectedCount}</span>}
          <svg
            className="sidecar-filter-chevron"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        {isOpen && (
          <div className="sidecar-tree-container">
            {treeData.map(node => renderTreeNode(node, filterKey, 0))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const allVisibleSelected = filteredUsers.length > 0 &&
    filteredUsers.every(user => selectedUserIds.includes(user.id));

  return (
    <>
      <div className="sidecar-overlay" onClick={handleClose} />
      <div className="sidecar-panel">
        <div className="sidecar-header">
          <h2 className="sidecar-title">Add users to group</h2>
          <button className="sidecar-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="sidecar-body">
          {/* Filters Section */}
          <div className="sidecar-filters">
            <div className="sidecar-filters-header">
              <h3 className="sidecar-section-title">Filter by attributes</h3>
              {hasActiveFilters && (
                <button className="sidecar-clear-btn" onClick={clearAllFilters}>
                  Clear all
                </button>
              )}
            </div>

            {renderFlatDropdown('skills', 'Skills', FLAT_FILTER_OPTIONS.skills)}
            {renderTreeFilter('language', 'Language')}
            {renderTreeFilter('region', 'Region')}
            {renderFlatDropdown('capacityProfile', 'Capacity Profile', FLAT_FILTER_OPTIONS.capacityProfile)}
            {renderFlatDropdown('intent', 'Intent', FLAT_FILTER_OPTIONS.intent)}

            {/* Active filters chips */}
            {hasActiveFilters && (
              <div className="sidecar-active-filters">
                {Object.entries(filters).map(([key, values]) =>
                  values.map(value => (
                    <span key={`${key}-${value}`} className="sidecar-filter-chip">
                      {value}
                      <button onClick={() => handleFilterChange(key as keyof Filters, value)}>
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="sidecar-divider" />

          {/* Users Section */}
          <div className="sidecar-users">
            <div className="sidecar-users-header">
              <h3 className="sidecar-section-title">
                Users
                {hasActiveFilters && filteredUsers.length > 0 && (
                  <span className="sidecar-users-count">{filteredUsers.length} found</span>
                )}
              </h3>
              {filteredUsers.length > 0 && (
                <button className="sidecar-select-all" onClick={handleSelectAll}>
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            {!hasActiveFilters ? (
              <div className="sidecar-empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#e1dfdd" strokeWidth="2" />
                  <path d="M24 16v16M16 24h16" stroke="#e1dfdd" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="sidecar-empty-title">Apply filters to find users</p>
                <p className="sidecar-empty-text">
                  Select one or more attributes above to see matching users
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="sidecar-empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#e1dfdd" strokeWidth="2" />
                  <path d="M18 18l12 12M30 18l-12 12" stroke="#e1dfdd" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="sidecar-empty-title">No users found</p>
                <p className="sidecar-empty-text">
                  Try adjusting your filters to find users
                </p>
              </div>
            ) : (
              <div className="sidecar-users-list">
                {filteredUsers.map(user => (
                  <label key={user.id} className={`sidecar-user-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleToggleUser(user.id)}
                    />
                    <div className="sidecar-user-info">
                      <span className="sidecar-user-name">{user.name}</span>
                      <div className="sidecar-user-attributes">
                        {user.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="sidecar-attr-badge">{skill}</span>
                        ))}
                        {user.language.slice(0, 1).map(lang => (
                          <span key={lang} className="sidecar-attr-badge">{lang}</span>
                        ))}
                        {user.region.slice(0, 1).map(reg => (
                          <span key={reg} className="sidecar-attr-badge">{reg}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sidecar-footer">
          <button className="sidecar-btn sidecar-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="sidecar-btn sidecar-btn-primary"
            onClick={handleAddUsers}
            disabled={selectedUserIds.length === 0}
          >
            Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}` : 'users'}
          </button>
        </div>
      </div>
    </>
  );
};

export default UserSelectionSidecar;
