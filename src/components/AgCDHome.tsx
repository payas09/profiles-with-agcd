import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import './AgCDHome.css';

// Prompt gallery data structure with cards
interface PromptCard {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
}

const promptGalleryCards: { orchestration: PromptCard[], assignment: PromptCard[] } = {
  orchestration: [
    {
      id: 'wait-time-escalation',
      title: 'Escalate priority based on wait time',
      description: 'Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.',
      category: 'Dynamic prioritization',
      tags: ['Based on wait time']
    },
    {
      id: 'queue-transfer-escalation',
      title: 'Escalate priority based on transfer to a queue',
      description: 'Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.',
      category: 'Dynamic prioritization',
      tags: ['Based on queue transfers']
    },
    {
      id: 'scheduled-callback-overflow',
      title: 'Configure scheduled callback as overflow action',
      description: 'When queue capacity is reached, automatically offer customers the option to schedule a callback at their convenience.',
      category: 'Overflow handling'
    },
    {
      id: 'did-overflow',
      title: 'Overflow for Direct Inward Dialing',
      description: 'Route incoming DID calls to alternative queues or agents when primary resources are unavailable.',
      category: 'Overflow handling'
    },
    {
      id: 'agent-availability-overflow',
      title: 'Immediate overflow based on agent availability',
      description: 'Instantly redirect conversations to overflow queues when no agents are available in the primary queue.',
      category: 'Overflow handling'
    },
    {
      id: 'offline-overflow',
      title: 'Immediate overflow when all agents are offline',
      description: 'Automatically route conversations when all agents in a queue are offline or unavailable.',
      category: 'Overflow handling'
    },
    {
      id: 'recurring-overflow',
      title: 'Recurring overflow actions',
      description: 'Set up repeating overflow actions based on time patterns or recurring queue conditions.',
      category: 'Overflow handling'
    },
    {
      id: 'messages-with-overflow',
      title: 'Combine frequent messages with overflow actions',
      description: 'Send periodic status updates to customers while implementing overflow routing strategies.',
      category: 'Overflow handling'
    },
    {
      id: 'interval-messages',
      title: 'Play message at specific time intervals',
      description: 'Deliver automated messages to customers at defined time intervals during their wait.',
      category: 'Automated messages'
    },
    {
      id: 'frequent-messages-overflow',
      title: 'Combine frequent messages with overflow actions',
      description: 'Coordinate automated messaging with overflow routing to keep customers informed.',
      category: 'Automated messages'
    }
  ],
  assignment: [
    {
      id: 'preferred-then-last-expert',
      title: 'Assign to preferred expert and then last interacted expert',
      description: 'First attempt to assign to the customer\'s preferred expert, then fall back to the last expert they interacted with.',
      category: 'Assign to a predicted expert'
    },
    {
      id: 'last-interacted-expert',
      title: 'Assign to last interacted expert',
      description: 'Route conversations to the expert who most recently handled this customer\'s previous interactions.',
      category: 'Assign to a predicted expert'
    },
    {
      id: 'callback-creator',
      title: 'Assign to expert who created the callback',
      description: 'Route scheduled callbacks to the same expert who originally created the callback request.',
      category: 'Assign personal callbacks'
    },
    {
      id: 'reattempt-callback-assignment',
      title: 'Reattempt assignment to expert who created the callback',
      description: 'If the callback creator is unavailable, retry assignment to them before routing to other experts.',
      category: 'Assign personal callbacks'
    },
    {
      id: 'ring-expansion-restricted',
      title: 'Ring expansion with restricted fallback',
      description: 'Expand assignment progressively based on wait time, but restrict to defined user groups only.',
      category: 'Ring expansion',
      tags: ['Based on wait time']
    },
    {
      id: 'ring-expansion-open',
      title: 'Ring expansion with open fallback',
      description: 'Expand assignment progressively based on wait time, with final fallback to any queue member.',
      category: 'Ring expansion',
      tags: ['Based on wait time']
    }
  ]
};

const AgCDHome: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'playbook'>('home');
  const [activePromptFilter, setActivePromptFilter] = useState<'orchestration' | 'assignment'>('orchestration');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFilterTab, setGalleryFilterTab] = useState<'orchestration' | 'assignment'>('orchestration');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [gallerySearchQuery, setGallerySearchQuery] = useState<string>('');

  // Handle URL parameters to open gallery with specific filters
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const openGallery = searchParams.get('openGallery');
    const tab = searchParams.get('tab');
    const scenario = searchParams.get('scenario');

    if (openGallery === 'true') {
      setShowGalleryModal(true);
      if (tab === 'orchestration' || tab === 'assignment') {
        setGalleryFilterTab(tab);
      }
      if (scenario) {
        setSelectedScenario(scenario);
      }
      // Clear URL parameters after reading them
      window.history.replaceState({}, '', `${APP_CONFIG.basePath}/agcd`);
    }
  }, []);

  const handlePromptFilterClick = (filter: 'orchestration' | 'assignment') => {
    setActivePromptFilter(filter);
  };

  const handleTabChange = (tab: 'home' | 'playbook') => {
    setActiveTab(tab);
    if (tab === 'playbook') {
      navigate('/agcd/playbook');
    }
  };

  const handleOpenGallery = () => {
    setShowGalleryModal(true);
    setSelectedScenario('');
    setGallerySearchQuery('');
  };

  const handleCloseGallery = () => {
    setShowGalleryModal(false);
    setSelectedScenario('');
    setGallerySearchQuery('');
  };

  const handleGalleryFilterChange = (filter: 'orchestration' | 'assignment') => {
    setGalleryFilterTab(filter);
    setSelectedScenario('');
  };

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
  };

  // Get unique scenarios for the current filter tab
  const getCurrentScenarios = () => {
    const cards = promptGalleryCards[galleryFilterTab];
    const scenarios = [...new Set(cards.map(card => card.category))];
    return scenarios;
  };

  // Filter cards based on selections and search
  const getFilteredCards = () => {
    let cards = promptGalleryCards[galleryFilterTab];

    // Filter by scenario
    if (selectedScenario) {
      cards = cards.filter(card => card.category === selectedScenario);
    }

    // Filter by search query
    if (gallerySearchQuery) {
      const query = gallerySearchQuery.toLowerCase();
      cards = cards.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.category.toLowerCase().includes(query)
      );
    }

    return cards;
  };

  const handleViewSamplePrompt = (cardId: string) => {
    navigate(`/agcd/prompt/${cardId}`);
    setShowGalleryModal(false);
  };

  return (
    <main className="main-content agcd-home">
      <div className="agcd-home-wrapper">
        {/* Tab Switcher */}
        <div className="agcd-tab-switcher-container">
          <div className="agcd-tab-switcher">
            <button
              className={`agcd-tab-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => handleTabChange('home')}
            >
              Home
            </button>
            <button
              className={`agcd-tab-button ${activeTab === 'playbook' ? 'active' : ''}`}
              onClick={() => handleTabChange('playbook')}
            >
              Playbook
            </button>
          </div>
        </div>

        <div className="agcd-home-header">
        <div className="agcd-title-row">
          <h1 className="agcd-main-title">Orchestration Agent (Preview)</h1>
          <span className="preview-badge-inline">Preview: Testing</span>
        </div>
        <p className="agcd-subtitle">
          Use our intuitive natural language prompting to create routing scenarios. Create playbooks to control routing patterns, working hours, assignment logic, and automated actions. Deliver exactly what your customers need, when they need it.
        </p>
      </div>

      <div className="agcd-get-started-section">
        <h2 className="section-title-large">Get started</h2>

        <div className="steps-container">
          <div className="step-item-horizontal">
            <div className="step-number-circle">1</div>
            <div className="step-text-content">
              <h3 className="step-heading">Start with a prompt template</h3>
              <p className="step-text">
                Select one of the pre-configured templates below. These templates provide starting points for common routing scenarios, which you can customize using natural language. Edit the prompt and fine-tune it to match your exact needs and business requirements.
              </p>
            </div>
          </div>

          <div className="step-item-horizontal">
            <div className="step-number-circle">2</div>
            <div className="step-text-content">
              <h3 className="step-heading">Create and Edit playbooks</h3>
              <p className="step-text">
                Create or add to existing playbooks using natural language. A playbook cannot work out of the box without any user instruction (customization).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="agcd-prompts-section">
        <div className="prompts-section-header">
          <h2 className="section-title-medium">Get Started with Prompt Templates</h2>
          <button className="prompt-gallery-button" onClick={handleOpenGallery}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 0 0-2 2v3.5a.5.5 0 0 0 1 0V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3.5a.5.5 0 0 0 1 0V5a2 2 0 0 0-2-2H4zm0 8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H4zm-1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2z"/>
            </svg>
            Template Gallery
          </button>
        </div>

        <div className="prompt-template-buttons">
          <button
            className={`prompt-template-btn ${activePromptFilter === 'orchestration' ? 'active' : ''}`}
            onClick={() => handlePromptFilterClick('orchestration')}
          >
            Orchestrator
          </button>
          <button
            className={`prompt-template-btn ${activePromptFilter === 'assignment' ? 'active' : ''}`}
            onClick={() => handlePromptFilterClick('assignment')}
          >
            Assignment
          </button>
        </div>

        <div className="prompts-card-grid">
          {promptGalleryCards[activePromptFilter].map((card) => (
            <button key={card.id} className="prompt-card-item" onClick={() => handleViewSamplePrompt(card.id)}>
              <div className="card-icon-title">
                <span className="card-title-text">{card.title}</span>
              </div>
              <p className="card-description-text">
                {card.description}
              </p>
            </button>
          ))}
        </div>

        <div className="view-all-prompts">
          <button className="view-all-button" onClick={() => navigate('/agcd/playbook')}>
            View all →
          </button>
        </div>
      </div>

      {/* Subtle link to conversational experience */}
      <div className="conversational-link-section">
        <span className="conversational-link-text">Looking for natural language playbook creation?</span>
        <button className="conversational-link-btn" onClick={() => navigate('/agcd/conversational')}>
          Try conversational experience →
        </button>
      </div>
      </div>

      {/* Template Gallery Modal */}
      {showGalleryModal && (
        <>
          <div className="gallery-modal-overlay" onClick={handleCloseGallery}></div>
          <div className="gallery-modal">
            <div className="gallery-modal-header">
              <h2 className="gallery-modal-title">Template Gallery</h2>
              <button className="gallery-modal-close" onClick={handleCloseGallery}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="gallery-modal-content">
              {/* Filter Buttons and Search Row */}
              <div className="gallery-top-controls">
                {/* Filter Buttons */}
                <div className="gallery-filter-buttons">
                  <button
                    className={`gallery-filter-btn ${galleryFilterTab === 'orchestration' ? 'active' : ''}`}
                    onClick={() => handleGalleryFilterChange('orchestration')}
                  >
                    Orchestration
                  </button>
                  <button
                    className={`gallery-filter-btn ${galleryFilterTab === 'assignment' ? 'active' : ''}`}
                    onClick={() => handleGalleryFilterChange('assignment')}
                  >
                    Assignment
                  </button>
                </div>

                {/* Search Box */}
                <div className="gallery-search-wrapper">
                  <svg className="gallery-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input
                    type="text"
                    className="gallery-search-input"
                    placeholder="Search templates"
                    value={gallerySearchQuery}
                    onChange={(e) => setGallerySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Scenario Filter */}
              <div className="gallery-dropdowns-row">
                <div className="gallery-dropdown-group">
                  <select
                    className="gallery-dropdown-select"
                    value={selectedScenario}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                  >
                    <option value="">All scenarios</option>
                    {getCurrentScenarios().map((scenario) => (
                      <option key={scenario} value={scenario}>
                        {scenario}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="gallery-cards-grid">
                {getFilteredCards().length > 0 ? (
                  getFilteredCards().map((card) => (
                    <div key={card.id} className="gallery-card">
                      <div className="gallery-card-header">
                        <h3 className="gallery-card-title">{card.title}</h3>
                        {card.tags && card.tags.length > 0 && (
                          <div className="gallery-card-tags">
                            {card.tags.map((tag, index) => (
                              <span key={index} className="gallery-card-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="gallery-card-description">{card.description}</p>
                      <button
                        className="gallery-card-view-btn"
                        onClick={() => handleViewSamplePrompt(card.id)}
                      >
                        Use this template →
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="gallery-no-results">
                    <p>No templates found matching your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default AgCDHome;
