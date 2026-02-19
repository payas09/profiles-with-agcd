import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    }
  ]
};

// Scenario definitions for template-based experience
const scenarioDefinitions = [
  {
    id: 'preferred-expert-assignment',
    title: 'Assign to Preferred Expert',
    description: 'Route customers to their designated preferred expert based on customer attributes.',
    category: 'assignment',
    icon: 'star'
  },
  {
    id: 'previous-expert-assignment',
    title: 'Assign to Previous Expert',
    description: 'Route to an expert who previously helped the customer within a lookback period.',
    category: 'assignment',
    icon: 'history'
  },
  {
    id: 'conditional-routing',
    title: 'Conditional Routing',
    description: 'Create routing rules based on multiple conditions like VIP status, intent, region.',
    category: 'assignment',
    icon: 'branch'
  },
  {
    id: 'skill-based-routing',
    title: 'Skill-Based Routing',
    description: 'Route conversations to experts with specific skills matching the inquiry type.',
    category: 'assignment',
    icon: 'skill'
  }
];

const AgCDHome: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'playbook'>('home');
  const [activePromptFilter, setActivePromptFilter] = useState<'orchestration' | 'assignment'>('orchestration');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFilterTab, setGalleryFilterTab] = useState<'orchestration' | 'assignment'>('orchestration');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedSubScenario, setSelectedSubScenario] = useState<string>('');
  const [gallerySearchQuery, setGallerySearchQuery] = useState<string>('');
  const [nlRequirement, setNlRequirement] = useState<string>('');
  const [showScenarioSelection, setShowScenarioSelection] = useState(false);

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
      window.history.replaceState({}, '', '/agcd-with-profiles/agcd');
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
    setSelectedSubScenario('');
    setGallerySearchQuery('');
  };

  const handleCloseGallery = () => {
    setShowGalleryModal(false);
    setSelectedScenario('');
    setSelectedSubScenario('');
    setGallerySearchQuery('');
  };

  const handleGalleryFilterChange = (filter: 'orchestration' | 'assignment') => {
    setGalleryFilterTab(filter);
    setSelectedScenario('');
    setSelectedSubScenario('');
  };

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
    setSelectedSubScenario('');
  };

  // Get unique scenarios for the current filter tab
  const getCurrentScenarios = () => {
    const cards = promptGalleryCards[galleryFilterTab];
    const scenarios = [...new Set(cards.map(card => card.category))];
    return scenarios;
  };

  // Get sub-scenarios (card titles) for the selected scenario
  const getCurrentSubScenarios = () => {
    if (!selectedScenario) return [];
    const cards = promptGalleryCards[galleryFilterTab];
    return cards
      .filter(card => card.category === selectedScenario)
      .map(card => card.title);
  };

  // Filter cards based on selections and search
  const getFilteredCards = () => {
    let cards = promptGalleryCards[galleryFilterTab];

    // Filter by scenario
    if (selectedScenario) {
      cards = cards.filter(card => card.category === selectedScenario);
    }

    // Filter by sub-scenario (card title)
    if (selectedSubScenario) {
      cards = cards.filter(card => card.title === selectedSubScenario);
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

  const handleNlRequirementSubmit = () => {
    if (nlRequirement.trim()) {
      // Show scenario selection instead of navigating directly
      setShowScenarioSelection(true);
    }
  };

  const handleNlKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNlRequirementSubmit();
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    // Navigate to edit page with template mode, requirement, and selected scenario
    navigate(`/agcd/prompt/assignment?mode=template&requirement=${encodeURIComponent(nlRequirement)}&scenario=${scenarioId}`);
  };

  const handleBackToInput = () => {
    setShowScenarioSelection(false);
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
          Use our intuitive natural language prompting to create routing scenarios. Create policies to control routing patterns, working hours, assignment logic, and automated actions. Deliver exactly what your customers need, when they need it.
        </p>
      </div>

      {/* Natural Language Requirement Input */}
      <div className="nl-requirement-section">
        <div className="nl-requirement-card">
          {!showScenarioSelection ? (
            <>
              <div className="nl-requirement-header">
                <div className="nl-icon-container">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="nl-header-text">
                  <h3 className="nl-title">Describe your routing requirement</h3>
                  <p className="nl-subtitle">Tell us what you want to achieve in plain English, and we'll help you build the right policy.</p>
                </div>
              </div>
              <div className="nl-input-container">
                <textarea
                  className="nl-input-textarea"
                  placeholder="Example: I want to route premium customers to their preferred expert, and if not available, to the last expert they interacted with in the past 14 days..."
                  value={nlRequirement}
                  onChange={(e) => setNlRequirement(e.target.value)}
                  onKeyDown={handleNlKeyDown}
                  rows={3}
                />
                <button
                  className="nl-submit-btn"
                  onClick={handleNlRequirementSubmit}
                  disabled={!nlRequirement.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  Continue
                </button>
              </div>
              <div className="nl-examples">
                <span className="nl-examples-label">Try:</span>
                <button
                  className="nl-example-chip"
                  onClick={() => setNlRequirement('Route VIP customers to their preferred expert based on their account tier')}
                >
                  VIP customer routing
                </button>
                <button
                  className="nl-example-chip"
                  onClick={() => setNlRequirement('Assign conversations to the previous expert who handled the customer in the last 14 days')}
                >
                  Previous expert assignment
                </button>
                <button
                  className="nl-example-chip"
                  onClick={() => setNlRequirement('Route billing inquiries from enterprise customers to billing specialists')}
                >
                  Skill-based routing
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Scenario Selection View */}
              <div className="scenario-selection-header">
                <button className="back-to-input-btn" onClick={handleBackToInput}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 2l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                <div className="scenario-header-content">
                  <h3 className="nl-title">Select a scenario that best matches your requirement</h3>
                  <div className="user-requirement-display">
                    <span className="requirement-label-small">Your requirement:</span>
                    <p className="requirement-text-small">"{nlRequirement}"</p>
                  </div>
                </div>
              </div>
              <div className="scenario-cards-grid">
                {scenarioDefinitions.map((scenario) => (
                  <button
                    key={scenario.id}
                    className="scenario-card"
                    onClick={() => handleScenarioSelect(scenario.id)}
                  >
                    <div className="scenario-card-icon">
                      {scenario.icon === 'star' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                      {scenario.icon === 'history' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                        </svg>
                      )}
                      {scenario.icon === 'branch' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 3v12h3v6l8-8h-4V3H6z"/>
                        </svg>
                      )}
                      {scenario.icon === 'skill' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      )}
                    </div>
                    <div className="scenario-card-content">
                      <h4 className="scenario-card-title">{scenario.title}</h4>
                      <p className="scenario-card-desc">{scenario.description}</p>
                    </div>
                    <div className="scenario-card-arrow">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="agcd-get-started-section">
        <h2 className="section-title-large">Get started</h2>

        <div className="steps-container">
          <div className="step-item-horizontal">
            <div className="step-number-circle">1</div>
            <div className="step-text-content">
              <h3 className="step-heading">Start with a canned prompt</h3>
              <p className="step-text">
                Select one of the pre-configured templates below. These templates provide starting points for common routing scenarios, which you can customize using natural language. Edit the prompt and fine-tune it to match your exact needs and business requirements.
              </p>
            </div>
          </div>

          <div className="step-item-horizontal">
            <div className="step-number-circle">2</div>
            <div className="step-text-content">
              <h3 className="step-heading">Add and Edit policies</h3>
              <p className="step-text">
                Create or add to existing policies using natural language. A policy cannot work out of the box without any user instruction (customization).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="agcd-prompts-section">
        <div className="prompts-section-header">
          <h2 className="section-title-medium">Get Started with Canned Prompts</h2>
          <button className="prompt-gallery-button" onClick={handleOpenGallery}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 0 0-2 2v3.5a.5.5 0 0 0 1 0V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3.5a.5.5 0 0 0 1 0V5a2 2 0 0 0-2-2H4zm0 8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H4zm-1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2z"/>
            </svg>
            Prompt Gallery
          </button>
        </div>

        <div className="canned-prompts-buttons">
          <button
            className={`canned-prompt-btn ${activePromptFilter === 'orchestration' ? 'active' : ''}`}
            onClick={() => handlePromptFilterClick('orchestration')}
          >
            Orchestrator
          </button>
          <button
            className={`canned-prompt-btn ${activePromptFilter === 'assignment' ? 'active' : ''}`}
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
      </div>

      {/* Prompt Gallery Modal */}
      {showGalleryModal && (
        <>
          <div className="gallery-modal-overlay" onClick={handleCloseGallery}></div>
          <div className="gallery-modal">
            <div className="gallery-modal-header">
              <h2 className="gallery-modal-title">AgCD Prompt gallery</h2>
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
                    placeholder="Search for prompts"
                    value={gallerySearchQuery}
                    onChange={(e) => setGallerySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Dropdown Filters */}
              <div className="gallery-dropdowns-row">
                {/* Scenario Dropdown */}
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

                {/* Sub-scenario Dropdown */}
                <div className="gallery-dropdown-group">
                  <select
                    className="gallery-dropdown-select"
                    value={selectedSubScenario}
                    onChange={(e) => setSelectedSubScenario(e.target.value)}
                    disabled={!selectedScenario}
                  >
                    <option value="">All sub-scenarios</option>
                    {getCurrentSubScenarios().map((subScenario) => (
                      <option key={subScenario} value={subScenario}>
                        {subScenario}
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
                        View sample prompt →
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="gallery-no-results">
                    <p>No prompts found matching your filters.</p>
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
