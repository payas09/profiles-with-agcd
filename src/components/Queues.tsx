import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getUserGroups } from '../lib/userGroupStorage';
import type { UserGroup } from '../lib/userGroupTypes';
import './Queues.css';

interface QueueData {
  id: string;
  name: string;
  queuePriority: number;
  type: 'Voice' | 'Chat' | 'Record';
  owner: string;
  createdOn: string;
}

const queuesData: QueueData[] = [
  {
    id: 'q1',
    name: 'General Support Queue',
    queuePriority: 50,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '8/5/2025 9:00 AM'
  },
  {
    id: 'q2',
    name: 'VIP Support Queue',
    queuePriority: 100,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '8/10/2025 10:30 AM'
  },
  {
    id: 'q3',
    name: 'Technical Support Queue',
    queuePriority: 75,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '8/12/2025 2:15 PM'
  },
  {
    id: 'q4',
    name: 'Sales Queue',
    queuePriority: 80,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '8/15/2025 11:00 AM'
  },
  {
    id: 'q5',
    name: 'Billing Queue',
    queuePriority: 60,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '8/18/2025 3:45 PM'
  },
  {
    id: 'q6',
    name: 'Chat Support Queue',
    queuePriority: 50,
    type: 'Chat',
    owner: 'Aurora365 User6',
    createdOn: '8/20/2025 9:30 AM'
  },
  {
    id: 'q7',
    name: 'Live Chat Queue',
    queuePriority: 70,
    type: 'Chat',
    owner: 'Aurora365 User6',
    createdOn: '8/22/2025 1:00 PM'
  },
  {
    id: 'q8',
    name: 'Case Management Queue',
    queuePriority: 40,
    type: 'Record',
    owner: 'Aurora365 User6',
    createdOn: '8/25/2025 10:15 AM'
  },
  {
    id: 'q9',
    name: 'Emergency Queue',
    queuePriority: 100,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '9/1/2025 8:00 AM'
  },
  {
    id: 'q10',
    name: 'After Hours Queue',
    queuePriority: 30,
    type: 'Voice',
    owner: 'Aurora365 User6',
    createdOn: '9/5/2025 4:30 PM'
  },
  {
    id: 'q11',
    name: 'Social Media Queue',
    queuePriority: 55,
    type: 'Chat',
    owner: 'Aurora365 User6',
    createdOn: '9/8/2025 11:45 AM'
  },
  {
    id: 'q12',
    name: 'Email Support Queue',
    queuePriority: 45,
    type: 'Record',
    owner: 'Aurora365 User6',
    createdOn: '9/10/2025 2:00 PM'
  }
];

const Queues: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUserGroups(getUserGroups());
  }, []);

  const filteredQueues = useMemo(() => {
    if (!searchQuery.trim()) return queuesData;
    const query = searchQuery.toLowerCase();
    return queuesData.filter(queue =>
      queue.name.toLowerCase().includes(query) ||
      queue.type.toLowerCase().includes(query) ||
      queue.owner.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getAssociatedGroups = (queueId: string): UserGroup[] => {
    return userGroups.filter(group => group.associatedQueueIds.includes(queueId));
  };

  const renderUserGroupsCell = (queue: QueueData) => {
    const associatedGroups = getAssociatedGroups(queue.id);
    const count = associatedGroups.length;

    if (count === 0) {
      return <span className="no-usergroups">—</span>;
    }

    const maxVisible = 3;
    const visibleGroups = associatedGroups.slice(0, maxVisible);
    const remainingCount = count - maxVisible;

    return (
      <div className="usergroups-names-list">
        {visibleGroups.map((group, index) => (
          <span key={group.id} className="usergroup-name-tag">
            {group.name}
            {index < visibleGroups.length - 1 || remainingCount > 0 ? ', ' : ''}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="usergroups-more">+{remainingCount} more</span>
        )}
      </div>
    );
  };

  return (
    <main className="main-content queues-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="add-button-toolbar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add queue
          </button>
          <button className="refresh-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
            </svg>
            Refresh
          </button>
        </div>
        <div className="toolbar-right">
          <div className="search-box-toolbar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm-1.27 4.27a6 6 0 1 1 1.06-1.06l3.5 3.5-1.06 1.06-3.5-3.5z" />
            </svg>
            <input
              type="text"
              placeholder="Search queues"
              className="search-input-toolbar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="content-header">
        <h1 className="page-title">Queues</h1>
        <p className="page-description">
          Manage queues for distributing work items to agents. Queues organize and prioritize incoming customer requests across different channels.
        </p>
      </div>

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
              <th>
                <div className="th-content">
                  Queue priority
                  <svg className="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 3l3 4H3l3-4z" />
                  </svg>
                </div>
              </th>
              <th>Type</th>
              <th>User Groups</th>
              <th>Owner</th>
              <th>CreatedOn</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueues.map((queue) => (
              <tr key={queue.id}>
                <td>
                  <Link to={`/queue/${queue.id}`} className="table-link">
                    {queue.name}
                  </Link>
                </td>
                <td>{queue.queuePriority}</td>
                <td>{queue.type}</td>
                <td className="usergroups-cell">
                  {renderUserGroupsCell(queue)}
                </td>
                <td>{queue.owner}</td>
                <td>{queue.createdOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  );
};

export default Queues;
