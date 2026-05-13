import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSACHome.css';

const IndustryTemplateIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="14" height="24" rx="2" stroke="#0078d4" strokeWidth="2" fill="none" />
    <rect x="10" y="8" width="14" height="24" rx="2" stroke="#0078d4" strokeWidth="2" fill="none" />
    <rect x="16" y="8" width="14" height="24" rx="2" stroke="#0078d4" strokeWidth="2" fill="#e8f4ff" />
    <path d="M19 16h8M19 20h8M19 24h5" stroke="#0078d4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RequirementsDocIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="22" height="28" rx="2" stroke="#0078d4" strokeWidth="2" fill="#e8f4ff" />
    <path d="M13 12h12M13 17h12M13 22h8" stroke="#0078d4" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="30" cy="30" r="7" fill="#0078d4" />
    <path d="M27 30l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AgenticSimIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8a12 12 0 1 0 0 24A12 12 0 0 0 20 8z" stroke="#0078d4" strokeWidth="2" fill="#e8f4ff" />
    <path d="M16 20l2 2 6-6" stroke="#0078d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4v4M20 32v4M4 20h4M32 20h4" stroke="#0078d4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15 8L1 1l3 7-3 7 14-7z" />
  </svg>
);

const CSACHome: React.FC = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      navigate('/service-operations-agent', { state: { initialMessage: chatInput } });
    } else {
      navigate('/service-operations-agent');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleChatSubmit();
    }
  };

  return (
    <div className="csac-home">
      <div className="soa-hero-card">
        <h1 className="soa-hero-title">Setup your contact center with Service Operations Agent (preview)</h1>

        <div className="soa-chat-input-container" onClick={() => {}}>
          <span className="soa-chat-input-placeholder">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start with a guided prompt below, describe your setup needs, or ask a question anytime."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                color: '#1b1b1b',
                background: 'transparent',
              }}
            />
          </span>
          <div className="soa-chat-input-actions">
            <button className="soa-chat-add-btn" title="Attach">+</button>
            <button className="soa-chat-send-btn" onClick={handleChatSubmit} title="Send">
              <SendIcon />
            </button>
          </div>
        </div>

        <div className="soa-option-cards">
          <div className="soa-option-card" onClick={() => navigate('/service-operations-agent', { state: { mode: 'industry-template' } })}>
            <div className="soa-option-icon">
              <IndustryTemplateIcon />
            </div>
            <div>
              <p className="soa-option-card-title">Industry template</p>
              <p className="soa-option-card-desc">Start with a pre-built template tailored to your industry and let the agent set it up for you.</p>
            </div>
          </div>

          <div className="soa-option-card" onClick={() => navigate('/service-operations-agent', { state: { mode: 'requirements-doc' } })}>
            <div className="soa-option-icon">
              <RequirementsDocIcon />
            </div>
            <div>
              <p className="soa-option-card-title">Requirements document</p>
              <p className="soa-option-card-desc">Upload a document with your contact center requirements. Service Operations Agent will interpret your specifications and configure, validate, and guide setup across your environment.</p>
            </div>
          </div>

          <div className="soa-option-card" onClick={() => navigate('/service-operations-agent', { state: { mode: 'simulation' } })}>
            <div className="soa-option-icon">
              <AgenticSimIcon />
            </div>
            <div>
              <p className="soa-option-card-title">Agentic simulation</p>
              <p className="soa-option-card-desc">Safely test configuration changes using natural language and preview how your contact center will behave, before applying them live.</p>
            </div>
          </div>
        </div>

        <div className="soa-ai-disclaimer">AI generated content may be incorrect.</div>
      </div>

      <div className="csac-home-bottom">
        <div className="csac-agent-hub-card">
          <div className="csac-agent-hub-header">
            <span className="csac-agent-hub-sparkle">✦</span>
            <span className="csac-agent-hub-title">Agent Hub</span>
          </div>
          <p className="csac-agent-hub-desc">
            Explore AI in Dynamics 365, streamline AI adoption, and monitor AI performance in real time to gain insights
          </p>
          <div className="csac-agent-hub-chart">
            <div className="csac-agent-hub-chart-bar" />
          </div>
        </div>

        <div className="csac-health-card">
          <h3 className="csac-health-title">Contact center health</h3>
          <p className="csac-health-subtitle">
            Monitor your contact center setup for error, warnings, and suggestions to improve operations.{' '}
            <a href="#" className="csac-health-learn-more">Learn more</a>
          </p>
          <div className="csac-health-overview-label">Overview</div>
          <div className="csac-health-metrics">
            <div className="csac-health-metric">
              <div className="csac-metric-label">Calls/hour</div>
              <div className="csac-metric-value">
                1,245
                <span className="csac-metric-change up">↑ 12%</span>
              </div>
            </div>
            <div className="csac-health-metric">
              <div className="csac-metric-label">1st route success</div>
              <div className="csac-metric-value">
                87%
                <span className="csac-metric-change up">↑ 2%</span>
              </div>
            </div>
            <div className="csac-health-metric">
              <div className="csac-metric-label">Transfer rate</div>
              <div className="csac-metric-value">
                12%
                <span className="csac-metric-change" style={{ color: '#605e5c' }}>0%</span>
              </div>
            </div>
            <div className="csac-health-metric">
              <div className="csac-metric-label">CSAT</div>
              <div className="csac-metric-value">
                4.2
                <span className="csac-metric-change down">↓ 5%</span>
              </div>
            </div>
          </div>
          <div className="csac-health-suggestion">
            Lower system load suggestion — consider adjusting queue overflow thresholds to improve routing efficiency.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSACHome;
