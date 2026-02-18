import React, { useState, useRef, useEffect } from 'react';
import './CopilotPromptEditor.css';

interface Message {
  id: string;
  role: 'user' | 'copilot';
  content: string;
  timestamp: Date;
}

interface GeneratedPrompt {
  title: string;
  content: string;
}

interface CopilotPromptEditorProps {
  scenario?: string;
  onPromptGenerated?: (prompt: string) => void;
}

const CopilotPromptEditor: React.FC<CopilotPromptEditorProps> = ({
  scenario = 'Assignment Policy',
  onPromptGenerated: _onPromptGenerated
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'copilot',
      content: `Hi! I'm here to help you create an ${scenario}. Tell me about your requirements in plain English, and I'll generate the policy for you.\n\nFor example, you could say:\n"I want VIP customers calling for fraud issues to be routed to their preferred expert."`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate a prompt based on user input
  const generatePromptFromInput = (userMessage: string): GeneratedPrompt => {
    const lowerMessage = userMessage.toLowerCase();

    // Parse the user message and generate appropriate prompt
    let promptContent = '';

    if (lowerMessage.includes('vip') && lowerMessage.includes('fraud')) {
      promptContent = `Get the customer's VIP status from ContextVariable.IsVIP and the Intent of the conversation from LiveWorkItem.Intent.

All VIP customers reaching out for Fraud Assist related conversations should be first offered to one of the preferred experts mapped to them.

If no preferred agents are available, assign the conversation to a previous expert who has interacted with the customer in the last 10 days and has a minimum CSAT of 7.

In case of no previous expert, assign to the next best expert in the queue.`;
    } else if (lowerMessage.includes('vip') && (lowerMessage.includes('billing') || lowerMessage.includes('bill'))) {
      promptContent = `Get the customer's VIP status from ContextVariable.IsVIP and the Intent of the conversation from LiveWorkItem.Intent.

All VIP customers reaching out for Billing Inquiry related conversations should be routed to agents with Billing Expert skill.

If no billing experts are available, assign to the previous expert who has handled this customer's billing issues in the last 30 days.

In case of no previous expert, assign to the next available agent in the billing queue.`;
    } else if (lowerMessage.includes('vip')) {
      promptContent = `Get the customer's VIP status from ContextVariable.IsVIP.

All VIP customers should be first offered to one of the preferred experts mapped to them.

If no preferred agents are available, assign the conversation to a previous expert who has interacted with the customer in the last 14 days.

All other VIP customers should be offered to agents with high CSAT scores (minimum 8).

In case of no previous expert, assign to the next best expert in the queue.`;
    } else if (lowerMessage.includes('fraud')) {
      promptContent = `Get the Intent of the conversation from LiveWorkItem.Intent.

All customers reaching out for Fraud Assist related conversations should be routed to agents with Fraud Investigation skill.

These conversations should be assigned to agents with minimum CSAT of 8 and Resolution Rate above 90%.

In case of no available fraud specialists, escalate to the fraud team queue.`;
    } else if (lowerMessage.includes('language') || lowerMessage.includes('spanish') || lowerMessage.includes('french')) {
      const language = lowerMessage.includes('spanish') ? 'Spanish' : lowerMessage.includes('french') ? 'French' : 'the requested language';
      promptContent = `Get the customer's preferred language from ContextVariable.Language.

Customers requesting support in ${language} should be routed to agents who speak ${language}.

If no ${language}-speaking agents are available, offer the conversation to bilingual agents.

In case of no language match, assign to the next available agent with translation support enabled.`;
    } else if (lowerMessage.includes('technical') || lowerMessage.includes('tech support')) {
      promptContent = `Get the Intent of the conversation from LiveWorkItem.Intent.

All Technical Support conversations should be routed to agents with Technical Support skill.

Priority should be given to agents with:
- Skill Level: Advanced or Expert
- Resolution Rate above 85%
- Average Handle Time under 15 minutes

In case of no technical experts available, assign to the technical support queue.`;
    } else if (lowerMessage.includes('previous') || lowerMessage.includes('same agent') || lowerMessage.includes('last agent')) {
      promptContent = `Get the customer's interaction history.

All returning customers should be offered to the previous expert who last handled their conversation within the last 30 days.

If the previous expert is not available, route to an agent with similar skills and CSAT score.

In case of no match, assign to the next best expert in the queue based on skills and availability.`;
    } else {
      // Generic response
      promptContent = `Based on your requirements:

${userMessage}

Get the relevant customer context and conversation details.

Route conversations based on the specified criteria to the most suitable available agent.

If no matching agents are available, assign to the next best expert in the queue.`;
    }

    return {
      title: scenario,
      content: promptContent
    };
  };

  // Generate Copilot response based on user message
  const generateCopilotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for refinement requests
    if (lowerMessage.includes('change') || lowerMessage.includes('update') || lowerMessage.includes('modify')) {
      return "I've updated the policy based on your feedback. Please review the changes on the right panel. Let me know if you'd like any further adjustments.";
    }

    if (lowerMessage.includes('add') && (lowerMessage.includes('condition') || lowerMessage.includes('rule'))) {
      return "I've added the new condition to your policy. You can see the updated version on the right. Would you like to add anything else?";
    }

    if (lowerMessage.includes('looks good') || lowerMessage.includes('perfect') || lowerMessage.includes('that works')) {
      return "Great! Your policy is ready. You can review it on the right panel and save it when you're satisfied. Feel free to ask if you need any changes.";
    }

    if (lowerMessage.includes('csat') || lowerMessage.includes('rating') || lowerMessage.includes('score')) {
      return "I've incorporated the CSAT requirements into your policy. Agents will be filtered based on their customer satisfaction scores. Check the updated policy on the right.";
    }

    if (lowerMessage.includes('skill') || lowerMessage.includes('expertise')) {
      return "I've added skill-based routing to your policy. The system will match customers with agents who have the relevant expertise. See the updated policy on the right panel.";
    }

    // Default response for new policy creation
    return "I've created an assignment policy based on your requirements. You can see the generated policy on the right panel.\n\nWould you like me to:\n• Add more conditions?\n• Modify the routing logic?\n• Include additional agent attributes like CSAT or skills?";
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate Copilot thinking and responding
    setTimeout(() => {
      // Generate the prompt
      const newPrompt = generatePromptFromInput(userMessage.content);
      setGeneratedPrompt(newPrompt);

      // Generate Copilot response
      const copilotResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'copilot',
        content: generateCopilotResponse(userMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, copilotResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const suggestions = [
    "VIP customers with fraud issues should go to preferred experts",
    "Route billing inquiries to billing specialists",
    "Spanish-speaking customers should get Spanish-speaking agents",
    "Technical issues should go to senior technical support"
  ];

  return (
    <div className="copilot-editor">
      {/* Left Panel - Chat */}
      <div className="copilot-chat-panel">
        <div className="copilot-chat-header">
          <div className="copilot-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
          </div>
          <div className="copilot-header-text">
            <h3>Copilot</h3>
            <span>AI Assistant for Policy Creation</span>
          </div>
        </div>

        <div className="copilot-messages">
          {messages.map(message => (
            <div key={message.id} className={`copilot-message ${message.role}`}>
              {message.role === 'copilot' && (
                <div className="copilot-message-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <div className="copilot-message-content">
                <div className="copilot-message-text">{message.content}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="copilot-message copilot">
              <div className="copilot-message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="copilot-message-content">
                <div className="copilot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="copilot-suggestions">
            <div className="copilot-suggestions-label">Try saying:</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="copilot-suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="copilot-input-area">
          <textarea
            ref={inputRef}
            className="copilot-input"
            placeholder="Describe your routing requirements..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            className="copilot-send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Right Panel - Generated Prompt */}
      <div className="copilot-prompt-panel">
        <div className="copilot-prompt-header">
          <h3>Generated Policy</h3>
          {generatedPrompt && (
            <div className="copilot-prompt-actions">
              <button className="copilot-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
                Copy
              </button>
              <button className="copilot-action-btn copilot-action-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
                Apply
              </button>
            </div>
          )}
        </div>

        <div className="copilot-prompt-content">
          {generatedPrompt ? (
            <div className="copilot-generated">
              <div className="copilot-generated-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                </svg>
                Generated by Copilot
              </div>
              <div className="copilot-generated-text">
                {generatedPrompt.content.split('\n').map((line, index) => (
                  <p key={index} className={line.trim() === '' ? 'empty-line' : ''}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="copilot-empty-state">
              <div className="copilot-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <div className="copilot-empty-title">No policy generated yet</div>
              <div className="copilot-empty-subtitle">
                Describe your routing requirements in the chat, and I'll generate the policy for you.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CopilotPromptEditor;
