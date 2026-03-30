import React, { useState, useMemo } from 'react';
import { FLAT_FILTER_OPTIONS, HIERARCHICAL_FILTERS, TreeNode } from '../lib/userGroupTypes';
import './UserFilterSidecar.css';

export interface Filters {
  skills: string[];
  language: string[];
  region: string[];
  capacityProfile: string[];
  intent: string[];
}

interface UserFilterSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filters) => void;
  currentFilters: Filters;
}

const UserFilterSidecar: React.FC<UserFilterSidecarProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [filters, setFilters] = useState<Filters>(currentFilters);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({
    skills: '',
    language: '',
    region: '',
    capacityProfile: '',
    intent: ''
  });

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

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

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClose = () => {
    setFilters(currentFilters); // Reset to current filters on cancel
    onClose();
  };

  const renderTreeNode = (node: TreeNode, filterKey: keyof Filters, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
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

  const handleSearchChange = (filterKey: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [filterKey]: value }));
  };

  const getFilteredOptions = (filterKey: keyof Filters, options: readonly string[]) => {
    const searchTerm = searchTerms[filterKey]?.toLowerCase() || '';
    if (!searchTerm) return options;
    return options.filter(option => option.toLowerCase().includes(searchTerm));
  };

  const renderFlatSection = (filterKey: keyof Filters, label: string, options: readonly string[]) => {
    const isOpen = openSection === filterKey;
    const selectedCount = filters[filterKey].length;
    const filteredOptions = getFilteredOptions(filterKey, options);
    const searchTerm = searchTerms[filterKey] || '';

    return (
      <div className="filter-section">
        <div className="filter-section-header" onClick={() => setOpenSection(isOpen ? null : filterKey)}>
          <span className="filter-section-label">{label}</span>
          {selectedCount > 0 && <span className="filter-section-count">{selectedCount}</span>}
          <svg
            className="filter-section-chevron"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        {isOpen && (
          <div className="filter-section-body">
            <div className="filter-search-box">
              <svg className="filter-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M6 11a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM13 13l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="filter-search-input"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(filterKey, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  className="filter-search-clear"
                  onClick={(e) => { e.stopPropagation(); handleSearchChange(filterKey, ''); }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            <div className="filter-section-options">
              {filteredOptions.length === 0 ? (
                <div className="filter-no-results">No matches found</div>
              ) : (
                filteredOptions.map(option => (
                  <label key={option} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters[filterKey].includes(option)}
                      onChange={() => handleFilterChange(filterKey, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Filter tree nodes based on search term
  const filterTreeNodes = (nodes: TreeNode[], searchTerm: string): TreeNode[] => {
    if (!searchTerm) return nodes;

    const lowerSearch = searchTerm.toLowerCase();
    const result: TreeNode[] = [];

    for (const node of nodes) {
      const labelMatches = node.label.toLowerCase().includes(lowerSearch);
      const filteredChildren = node.children ? filterTreeNodes(node.children, searchTerm) : [];

      if (labelMatches || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
      }
    }

    return result;
  };

  const renderTreeSection = (filterKey: 'language' | 'region', label: string) => {
    const isOpen = openSection === filterKey;
    const selectedCount = filters[filterKey].length;
    const treeData = HIERARCHICAL_FILTERS[filterKey];
    const searchTerm = searchTerms[filterKey] || '';
    const filteredTreeData = filterTreeNodes(treeData, searchTerm);

    return (
      <div className="filter-section">
        <div className="filter-section-header" onClick={() => setOpenSection(isOpen ? null : filterKey)}>
          <span className="filter-section-label">{label}</span>
          {selectedCount > 0 && <span className="filter-section-count">{selectedCount}</span>}
          <svg
            className="filter-section-chevron"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        {isOpen && (
          <div className="filter-section-body">
            <div className="filter-search-box">
              <svg className="filter-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M6 11a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM13 13l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="filter-search-input"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(filterKey, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  className="filter-search-clear"
                  onClick={(e) => { e.stopPropagation(); handleSearchChange(filterKey, ''); }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            <div className="filter-tree-container">
              {filteredTreeData.length === 0 ? (
                <div className="filter-no-results">No matches found</div>
              ) : (
                filteredTreeData.map(node => renderTreeNode(node, filterKey, 0))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="filter-sidecar-overlay" onClick={handleClose} />
      <div className="filter-sidecar-panel">
        <div className="filter-sidecar-header">
          <h2 className="filter-sidecar-title">Filter users</h2>
          <button className="filter-sidecar-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="filter-sidecar-body">
          <div className="filter-sidecar-intro">
            <p>Select attributes to filter the user list. Users matching all selected criteria will be shown.</p>
          </div>

          <div className="filter-sections">
            {renderFlatSection('skills', 'Skills', FLAT_FILTER_OPTIONS.skills)}
            {renderTreeSection('language', 'Language')}
            {renderTreeSection('region', 'Region')}
            {renderFlatSection('capacityProfile', 'Capacity Profile', FLAT_FILTER_OPTIONS.capacityProfile)}
            {renderFlatSection('intent', 'Intent', FLAT_FILTER_OPTIONS.intent)}
          </div>

          {/* Active filters grouped by attribute */}
          {hasActiveFilters && (
            <div className="filter-active-section">
              <div className="filter-active-header">
                <span className="filter-active-label">Active filters</span>
                <button className="filter-clear-all" onClick={clearAllFilters}>
                  Clear all
                </button>
              </div>
              <div className="filter-active-groups">
                {filters.skills.length > 0 && (
                  <div className="filter-active-group">
                    <span className="filter-group-label">Skills</span>
                    <div className="filter-group-chips">
                      {filters.skills.map(value => (
                        <span key={`skills-${value}`} className="filter-chip">
                          {value}
                          <button onClick={() => handleFilterChange('skills', value)}>
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {filters.language.length > 0 && (
                  <div className="filter-active-group">
                    <span className="filter-group-label">Language</span>
                    <div className="filter-group-chips">
                      {filters.language.map(value => (
                        <span key={`language-${value}`} className="filter-chip">
                          {value}
                          <button onClick={() => handleFilterChange('language', value)}>
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {filters.region.length > 0 && (
                  <div className="filter-active-group">
                    <span className="filter-group-label">Region</span>
                    <div className="filter-group-chips">
                      {filters.region.map(value => (
                        <span key={`region-${value}`} className="filter-chip">
                          {value}
                          <button onClick={() => handleFilterChange('region', value)}>
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {filters.capacityProfile.length > 0 && (
                  <div className="filter-active-group">
                    <span className="filter-group-label">Capacity Profile</span>
                    <div className="filter-group-chips">
                      {filters.capacityProfile.map(value => (
                        <span key={`capacityProfile-${value}`} className="filter-chip">
                          {value}
                          <button onClick={() => handleFilterChange('capacityProfile', value)}>
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {filters.intent.length > 0 && (
                  <div className="filter-active-group">
                    <span className="filter-group-label">Intent</span>
                    <div className="filter-group-chips">
                      {filters.intent.map(value => (
                        <span key={`intent-${value}`} className="filter-chip">
                          {value}
                          <button onClick={() => handleFilterChange('intent', value)}>
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="filter-sidecar-footer">
          <button className="filter-btn filter-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="filter-btn filter-btn-apply"
            onClick={handleApply}
            disabled={!hasActiveFilters}
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
};

export default UserFilterSidecar;
