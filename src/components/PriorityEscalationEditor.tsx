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
  initialState,
  onStateChange
}) => {
  const config = scenarioConfig[scenarioId] || scenarioConfig['wait-time-escalation'];

  // State for tips accordion
  const [isTipsOpen, setIsTipsOpen] = useState(true);

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
    <div className="template-based-editor">
      {/* Tips Accordion */}
      <div className="tips-accordion">
        <div
          className="tips-accordion-header"
          onClick={() => setIsTipsOpen(!isTipsOpen)}
        >
          <span className={`tips-chevron ${isTipsOpen ? 'open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
          <span className="tips-title">Tips for {config.title}</span>
        </div>
        {isTipsOpen && (
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

      {/* Main Template Section */}
      <div className="template-output-section-main">
        {/* Trigger Event - Static Display */}
        <div className="trigger-event-static">
          <span className="trigger-label">Trigger Event:</span>
          <span className="trigger-value">{config.triggerEvent}</span>
        </div>

        {/* Policy Template */}
        <div className="policy-template-section">
          <h3 className="template-section-title">Policy Behavior</h3>
          <p className="template-instruction">
            Configure the priority escalation values below. The policy will be automatically generated.
          </p>

          <div className="priority-template-container">
            {/* Main Rule */}
            <div className="priority-rule-box">
              <span className="rule-text">For all customers, increase the priority score of the conversation by</span>
              <input
                type="number"
                className="priority-input"
                value={priorityScore}
                onChange={(e) => setPriorityScore(e.target.value)}
                min="1"
                max="1000"
                placeholder="10"
              />
              {config.hasTimeInterval && (
                <>
                  <span className="rule-text">for every</span>
                  <input
                    type="number"
                    className="priority-input time-input"
                    value={timeInterval}
                    onChange={(e) => setTimeInterval(e.target.value)}
                    min="1"
                    max="3600"
                    placeholder="30"
                  />
                  <select
                    className="time-unit-select"
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value as 'seconds' | 'minutes')}
                  >
                    <option value="seconds">seconds</option>
                    <option value="minutes">minutes</option>
                  </select>
                  <span className="rule-text">increase in wait time.</span>
                </>
              )}
              {!config.hasTimeInterval && (
                <span className="rule-text">.</span>
              )}
            </div>

            {/* Default Fallback Rule */}
            <div className="priority-rule-box fallback-rule">
              <span className="rule-text">For all other customers, increase priority score by</span>
              <input
                type="number"
                className="priority-input"
                value={defaultScore}
                onChange={(e) => setDefaultScore(e.target.value)}
                min="0"
                max="1000"
                placeholder="5"
              />
              <span className="rule-text">.</span>
            </div>
          </div>
        </div>

        {/* Generated Policy Preview */}
        <div className="generated-policy-preview">
          <h4 className="preview-title">Generated Policy</h4>
          <div className="preview-text">
            {generatePolicyText()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityEscalationEditor;
