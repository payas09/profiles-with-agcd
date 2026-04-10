import React, { useState, useMemo } from 'react';
import type { QueueItem } from '../lib/userGroupTypes';
import './QueueSelectionSidecar.css';

interface QueueSelectionSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (queueIds: string[]) => void;
  availableQueues: QueueItem[];
  currentlyAssociatedIds: string[];
}

const QueueSelectionSidecar: React.FC<QueueSelectionSidecarProps> = ({
  isOpen,
  onClose,
  onSave,
  availableQueues,
  currentlyAssociatedIds: _currentlyAssociatedIds
}) => {
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQueues = useMemo(() => {
    if (!searchQuery.trim()) return availableQueues;
    const query = searchQuery.toLowerCase();
    return availableQueues.filter(queue =>
      queue.name.toLowerCase().includes(query) ||
      queue.description.toLowerCase().includes(query) ||
      queue.type.toLowerCase().includes(query)
    );
  }, [availableQueues, searchQuery]);

  const handleToggleQueue = (queueId: string) => {
    setSelectedQueueIds(prev =>
      prev.includes(queueId)
        ? prev.filter(id => id !== queueId)
        : [...prev, queueId]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredQueues.map(q => q.id);
    const allSelected = allFilteredIds.every(id => selectedQueueIds.includes(id));

    if (allSelected) {
      setSelectedQueueIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedQueueIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const handleSave = () => {
    onSave(selectedQueueIds);
    setSelectedQueueIds([]);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedQueueIds([]);
    setSearchQuery('');
    onClose();
  };

  const allFilteredSelected = filteredQueues.length > 0 &&
    filteredQueues.every(q => selectedQueueIds.includes(q.id));

  if (!isOpen) return null;

  return (
    <>
      <div className="queue-sidecar-overlay" onClick={handleClose} />
      <div className="queue-sidecar-panel">
        <div className="queue-sidecar-header">
          <h2 className="queue-sidecar-title">Add queues</h2>
          <button className="queue-sidecar-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="queue-sidecar-body">
          <div className="queue-sidecar-intro">
            <p>Select queues to associate with this user group. Users in this group will be able to handle work from these queues.</p>
          </div>

          {/* Search */}
          <div className="queue-search-box">
            <svg className="queue-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 15l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="queue-search-input"
              placeholder="Search queues by name, description, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="queue-search-clear" onClick={() => setSearchQuery('')}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Selection summary */}
          <div className="queue-selection-header">
            <span className="queue-count">
              {filteredQueues.length} queue{filteredQueues.length !== 1 ? 's' : ''} available
              {searchQuery && ` (filtered)`}
            </span>
            {filteredQueues.length > 0 && (
              <button className="queue-select-all-button" onClick={handleSelectAll}>
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          {/* Queue list */}
          <div className="queue-list">
            {filteredQueues.length === 0 ? (
              <div className="queue-empty-state">
                {availableQueues.length === 0
                  ? 'All queues are already associated with this group'
                  : 'No queues found matching your search'
                }
              </div>
            ) : (
              filteredQueues.map((queue) => (
                <label
                  key={queue.id}
                  className={`queue-item ${selectedQueueIds.includes(queue.id) ? 'queue-item-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="queue-checkbox"
                    checked={selectedQueueIds.includes(queue.id)}
                    onChange={() => handleToggleQueue(queue.id)}
                  />
                  <div className="queue-item-content">
                    <div className="queue-item-header">
                      <span className="queue-item-name">{queue.name}</span>
                      <span className="queue-type-badge">{queue.type}</span>
                    </div>
                    <p className="queue-item-description">{queue.description}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Selected queues summary */}
          {selectedQueueIds.length > 0 && (
            <div className="queue-selected-summary">
              <span className="queue-selected-count">
                {selectedQueueIds.length} queue{selectedQueueIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>

        <div className="queue-sidecar-footer">
          <button className="queue-btn queue-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="queue-btn queue-btn-save"
            onClick={handleSave}
            disabled={selectedQueueIds.length === 0}
          >
            Add {selectedQueueIds.length > 0 ? `${selectedQueueIds.length} ` : ''}queue{selectedQueueIds.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>
  );
};

export default QueueSelectionSidecar;
