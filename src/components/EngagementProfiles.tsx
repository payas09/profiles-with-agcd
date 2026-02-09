import React from 'react';
import { Link } from 'react-router-dom';
import './VoiceChannels.css';

interface EngagementProfileData {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdOn: string;
  status: string;
  queues: string[];
}

const engagementProfilesData: EngagementProfileData[] = [
  {
    id: 'profile1',
    name: 'Standard Support Profile',
    description: 'Default engagement profile for general customer support interactions',
    owner: 'Aurora365 User6',
    createdOn: '8/10/2025 10:00 AM',
    status: 'Active',
    queues: ['General Support Queue', 'Chat Support Queue', 'Live Chat Queue', 'Case Management Queue']
  },
  {
    id: 'profile2',
    name: 'VIP Customer Profile',
    description: 'Premium engagement experience for VIP customers with priority handling',
    owner: 'Aurora365 User6',
    createdOn: '8/12/2025 2:30 PM',
    status: 'Active',
    queues: ['VIP Support Queue', 'Emergency Queue']
  },
  {
    id: 'profile3',
    name: 'Technical Support Profile',
    description: 'Specialized profile for technical support with skill-based routing',
    owner: 'Aurora365 User6',
    createdOn: '8/15/2025 9:15 AM',
    status: 'Active',
    queues: ['Technical Support Queue']
  },
  {
    id: 'profile4',
    name: 'Sales Team Profile',
    description: 'Engagement profile optimized for sales interactions and lead conversion',
    owner: 'Aurora365 User6',
    createdOn: '8/18/2025 11:45 AM',
    status: 'Active',
    queues: ['Sales Queue']
  },
  {
    id: 'profile5',
    name: 'After-Hours Profile',
    description: 'Limited engagement profile for after-hours support coverage',
    owner: 'Aurora365 User6',
    createdOn: '8/20/2025 4:20 PM',
    status: 'Active',
    queues: ['After Hours Queue']
  },
  {
    id: 'profile6',
    name: 'Billing Support Profile',
    description: 'Engagement profile for billing and payment inquiries',
    owner: 'Aurora365 User6',
    createdOn: '8/25/2025 1:00 PM',
    status: 'Active',
    queues: ['Billing Queue']
  }
];

const EngagementProfiles: React.FC = () => {
  return (
    <main className="main-content">
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="add-button-toolbar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add engagement profile
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
            <input type="text" placeholder="Search engagement profiles" className="search-input-toolbar" />
          </div>
        </div>
      </div>

      <div className="content-header">
        <Link to="/channel-experiences" className="breadcrumb">Channel experiences</Link>
        <h1 className="page-title">Engagement profiles</h1>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <div className="th-content">
                  Profile Name
                  <svg className="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 3l3 4H3l3-4z" />
                  </svg>
                </div>
              </th>
              <th>Description</th>
              <th>Queues</th>
              <th>Status</th>
              <th>Owner</th>
              <th>CreatedOn</th>
            </tr>
          </thead>
          <tbody>
            {engagementProfilesData.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <Link to={`/engagement-profile/${profile.id}`} className="table-link">
                    {profile.name}
                  </Link>
                </td>
                <td>{profile.description}</td>
                <td>
                  <span className="queues-list">{profile.queues.join(', ')}</span>
                </td>
                <td>
                  <span className="status-badge status-active">{profile.status}</span>
                </td>
                <td>{profile.owner}</td>
                <td>{profile.createdOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default EngagementProfiles;
