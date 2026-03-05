/**
 * Priority Escalation Editor for AgCD Policy Creation
 * Handles "wait-time-escalation" and "queue-transfer-escalation" scenarios
 */

import React, { useState, useEffect } from 'react';
import './TemplateBasedEditor.css';

// ============================================
// Interfaces
// ============================================

interface PriorityBranchState {
  id: string;
  priorityScore: string;
  timeInterval?: string;
  timeUnit?: 'seconds' | 'minutes';
}

export interface PriorityEscalationEditorState {
  branches: PriorityBranchState[];
  defaultScore: string;
  scenarioId?: string;
}

interface PriorityEscalationEditorProps {
  scenarioId: string;
  initialRequirement?: string;
  initialState?: PriorityEscalationEditorState;
  onPromptGenerated?: (prompt: string, config: any) => void;
  onStateChange?: (state: PriorityEscalationEditorState, prompt: string) => void;
}

// ============================================
// Scenario Configuration
// ============================================

const scenarioConfig: { [key: string]: {
  title: string;
  triggerEvent: string;
  hasTimeInterval: boolean;
  tips: string[];
}} = {
  'wait-time-escalation': {
    title: 'Escalate priority based on wait time',
    triggerEvent: 'Conversation is waiting in the queue',
    hasTimeInterval: true,
    tips: [
      'Set a priority score increase for each time interval to ensure longer-waiting customers get higher priority.',
      'Consider starting with smaller score increments (e.g., 10-20) and shorter intervals (e.g., 30-60 seconds).',
      'The default score applies to all customers not matching specific conditions.',
      'Higher priority scores will cause conversations to be routed before lower-scored ones.'
    ]
  },
  'queue-transfer-escalation': {
    title: 'Escalate priority based on transfer to queue',
    triggerEvent: 'Conversation is transferred to the queue',
    hasTimeInterval: false,
    tips: [
      'Transferred conversations often indicate escalated issues - consider higher priority scores.',
      'The priority score is applied immediately when the conversation is transferred.',
      'The default score applies to all customers not matching specific conditions.',
      'Use this to ensure transferred customers don\'t wait as long as new conversations.'
    ]
  }
};

// ============================================
// Component
// ============================================

const PriorityEscalationEditor: React.FC<PriorityEscalationEditorProps> = ({
  scenarioId,
  initialRequirement,
  initialState,
  onStateChange
}) => {
  const config = scenarioConfig[scenarioId] || scenarioConfig['wait-time-escalation'];

  // State for tips accordion
  const [isTipsSectionOpen, setIsTipsSectionOpen] = useState(true);

  // State for the template values
  const [priorityScore, setPriorityScore] = useState(
    initialState?.branches?.[0]?.priorityScore || '10'
  );
  const [timeInterval, setTimeInterval] = useState(
    initialState?.branches?.[0]?.timeInterval || '30'
  );
  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes'>(
    initialState?.branches?.[0]?.timeUnit || 'seconds'
  );
  const [defaultScore, setDefaultScore] = useState(
    initialState?.defaultScore || '5'
  );

  // Generate the policy text
  const generatePolicyText = (): string => {
    if (config.hasTimeInterval) {
      return `For all customers, increase the priority score of the conversation by ${priorityScore} for every ${timeInterval} ${timeUnit} increase in wait time. For all other customers, increase priority score by ${defaultScore}.`;
    } else {
      return `For all customers, increase priority score of conversations by ${priorityScore}. For all other customers, increase priority score by ${defaultScore}.`;
    }
  };

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      const state: PriorityEscalationEditorState = {
        branches: [{
          id: 'branch-1',
          priorityScore,
          timeInterval: config.hasTimeInterval ? timeInterval : undefined,
          timeUnit: config.hasTimeInterval ? timeUnit : undefined
        }],
        defaultScore,
        scenarioId
      };
      onStateChange(state, generatePolicyText());
    }
  }, [priorityScore, timeInterval, timeUnit, defaultScore, scenarioId]);

  return (
    <div className="template-editor-container">
      {/* Requirement Banner */}
      {initialRequirement && (
        <div className="template-requirement-banner">
          <span className="req-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span className="req-label">Your requirement:</span>
          <span className="req-text">"{initialRequirement}"</span>
        </div>
      )}

      {/* Tips Accordion */}
      <div className="tips-accordion">
        <div
          className="tips-accordion-header"
          onClick={() => setIsTipsSectionOpen(!isTipsSectionOpen)}
        >
          <span className={`tips-chevron ${isTipsSectionOpen ? 'open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          <span className="tips-title">Tips</span>
        </div>
        {isTipsSectionOpen && (
          <div className="tips-accordion-content">
            <ul className="tips-list">
              {config.tips.map((tip, index) => (
                <li key={index} className="tip-item">
                  <svg className="tip-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
                    <path d="M8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z"/>
                  </svg>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Template Section - Always visible */}
      <div className="template-output-section-main">
        {/* Trigger Event - Static Display */}
        <div className="trigger-event-display">
          <span className="trigger-label">Trigger Event:</span>
          <span className="trigger-value">{config.triggerEvent}</span>
        </div>

        <div className="template-instruction">
          Click on the <span className="highlight-text">blue inputs</span> below to edit values. Then Save or Publish your policy.
        </div>

        <div className="template-output">
          {/* Main Rule */}
          <div className="template-line">
            For all customers, increase the priority score of the conversation by{' '}
            <input
              type="number"
              className="template-input-inline"
              value={priorityScore}
              onChange={(e) => setPriorityScore(e.target.value)}
              min="1"
              max="1000"
            />
            {config.hasTimeInterval && (
              <>
                {' '}for every{' '}
                <input
                  type="number"
                  className="template-input-inline"
                  value={timeInterval}
                  onChange={(e) => setTimeInterval(e.target.value)}
                  min="1"
                  max="3600"
                />
                {' '}
                <select
                  className="template-dropdown-inline"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as 'seconds' | 'minutes')}
                >
                  <option value="seconds">seconds</option>
                  <option value="minutes">minutes</option>
                </select>
                {' '}increase in wait time.
              </>
            )}
            {!config.hasTimeInterval && '.'}
          </div>

          {/* Default Fallback Rule */}
          <div className="template-line" style={{ marginTop: '16px' }}>
            <span className="policy-text policy-fallback">
              For all other customers, increase priority score by{' '}
              <input
                type="number"
                className="template-input-inline"
                value={defaultScore}
                onChange={(e) => setDefaultScore(e.target.value)}
                min="0"
                max="1000"
              />
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityEscalationEditor;
