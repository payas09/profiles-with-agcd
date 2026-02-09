import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="hamburger-menu" onClick={onToggle}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1H2V3zm0 4.5h12v1H2v-1zM2 12h12v1H2v-1z" />
        </svg>
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Get started</div>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2L2 6v6a2 2 0 002 2h8a2 2 0 002-2V6l-6-4z" />
            </svg>
            <span>Home</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5" fill="none" />
              <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span>Search admin sett...</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z" />
            </svg>
            <span>Guided channel s...</span>
          </a>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Customer support</div>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="5" r="2.5" />
              <path d="M3 13c0-2.5 2-4 5-4s5 1.5 5 4" />
            </svg>
            <span>User management</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>AI Agents</span>
          </a>
          <Link to="/" className="nav-item active">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h12v2H2V2zm0 5h12v2H2V7zm0 5h12v2H2v-2z" />
            </svg>
            <span>Channels</span>
          </Link>
          <Link to="/channel-experiences" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h10v2H3v-2z" />
              <circle cx="13" cy="4" r="1.5" fill="currentColor" />
              <circle cx="13" cy="8" r="1.5" fill="currentColor" />
              <circle cx="13" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span>Channel experiences</span>
          </Link>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
            </svg>
            <span>Intent</span>
          </a>
          <Link to="/queues" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Queues</span>
          </Link>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" />
              <path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Routing</span>
          </a>
          <Link to="/agcd" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <circle cx="8" cy="6" r="1" fill="currentColor"/>
              <path d="M6 10l2 2 2-2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Agentic routing</span>
          </Link>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="5" r="2.5" />
              <path d="M3 13c0-2.5 2-4 5-4s5 1.5 5 4" />
            </svg>
            <span>Profiles</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Case settings</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Customer settings</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Quality managem...</span>
          </a>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Support experience</div>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Workspaces</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Productivity</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Knowledge</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Collaboration</span>
          </a>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Operations</div>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Insights</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Workforce manag...</span>
          </a>
          <a href="#" className="nav-item">
            <svg className="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
            <span>Calendar</span>
          </a>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
