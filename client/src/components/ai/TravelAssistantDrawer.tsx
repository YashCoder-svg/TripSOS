import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Compass,
  DollarSign,
  HeartPulse,
  Send,
  Sparkles,
  Utensils,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useAiChat, useExecuteAiAction } from '../../services/aiService';
import type { AiChatMessage, AiSuggestedAction } from '../../types/ai';
import type { Trip } from '../../types/trip';

export interface TravelAssistantDrawerProps {
  trip?: Trip;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  { label: 'Plan tomorrow for me', icon: Wand2 },
  { label: "What's the weather forecast?", icon: Compass },
  { label: 'Find restaurants near me', icon: Utensils },
  { label: 'Show hospitals near destination', icon: HeartPulse },
  { label: 'How much have we spent so far?', icon: DollarSign },
];

export function TravelAssistantDrawer({ trip, isOpen, onClose }: TravelAssistantDrawerProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: trip
        ? `Hello! I'm your **TripSOS Travel & Safety Assistant** for **${trip.name}** in ${trip.destinationName}.\n\nI can check live weather, find verified restaurants & attractions, calculate your expenses, or plan your daily schedule with 1-click approvals.`
        : `Hello! I'm your **TripSOS Assistant**. Ask me about local weather, verified nearby services, or emergency assistance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [approvedActionIds, setApprovedActionIds] = useState<Set<string>>(new Set());

  const chatMutation = useAiChat();
  const actionMutation = useExecuteAiAction();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: AiChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    try {
      const response = await chatMutation.mutateAsync({
        message: text,
        tripId: trip?._id,
        location: trip?.destinationCoordinates
          ? {
              latitude: trip.destinationCoordinates.latitude,
              longitude: trip.destinationCoordinates.longitude,
            }
          : undefined,
        history: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMsg: AiChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: response.toolCalls,
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an issue retrieving verified information: ${
          err instanceof Error ? err.message : 'Please try again.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleApproveAction = async (action: AiSuggestedAction) => {
    if (approvedActionIds.has(action.id) || !trip) return;

    try {
      await actionMutation.mutateAsync({
        tripId: trip._id,
        actionType: action.type,
        data: action.data,
      });

      setApprovedActionIds((prev) => new Set(prev).add(action.id));
    } catch (err) {
      alert(`Failed to add to itinerary: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div
      className="ai-assistant-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-drawer-title"
    >
      <div className="ai-assistant-drawer">
        {/* Drawer Header */}
        <header className="ai-drawer-header">
          <div className="ai-drawer-title-block">
            <div className="ai-bot-avatar" aria-hidden="true">
              <Bot size={20} />
            </div>
            <div>
              <div className="ai-title-row">
                <h2 id="ai-drawer-title" className="ai-drawer-title">
                  TripSOS Travel Assistant
                </h2>
                <span className="ai-grounded-pill">
                  <Zap size={10} aria-hidden="true" />
                  Grounded Tools
                </span>
              </div>
              <p className="ai-drawer-subtitle">
                {trip ? `Assisting with ${trip.name}` : 'Real-time verified travel companion'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ai-drawer-close-btn"
            aria-label="Close Travel Assistant"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {/* Quick Suggestion Chips */}
        <div className="ai-chips-scroll" role="region" aria-label="Suggested questions">
          {DEFAULT_SUGGESTED_PROMPTS.map((prompt, idx) => {
            const Icon = prompt.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => void handleSendMessage(prompt.label)}
                className="ai-prompt-chip"
                disabled={chatMutation.isPending}
              >
                <Icon size={13} aria-hidden="true" />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div className="ai-chat-thread" ref={chatScrollRef} role="log" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-message-row ${
                msg.role === 'user' ? 'ai-message-row--user' : 'ai-message-row--assistant'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="ai-msg-avatar" aria-hidden="true">
                  <Sparkles size={16} />
                </div>
              )}

              <div className="ai-message-content">
                {/* Tool Attribution Badges */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="ai-tool-tags-list">
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <span key={tcIdx} className="ai-tool-tag">
                        <Zap size={10} aria-hidden="true" />
                        {tc.sourceAttribution ?? `Executed ${tc.tool}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="ai-bubble-markdown">
                  {msg.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="ai-md-heading">
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('⚠️')) {
                      return (
                        <div key={pIdx} className="ai-emergency-callout">
                          {paragraph}
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="ai-md-paragraph">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {/* Suggested Action Approval Cards */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="ai-suggested-actions-block">
                    <span className="ai-actions-heading">
                      <CalendarPlus size={14} aria-hidden="true" />
                      Suggested Itinerary Additions:
                    </span>
                    <div className="ai-actions-grid">
                      {msg.suggestedActions.map((action) => {
                        const isApproved = approvedActionIds.has(action.id);
                        return (
                          <div key={action.id} className="ai-action-card">
                            <div className="ai-action-info">
                              <strong className="ai-action-title">{action.title}</strong>
                              <span className="ai-action-desc">{action.description}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleApproveAction(action)}
                              disabled={isApproved || actionMutation.isPending}
                              className={`ai-action-approve-btn ${
                                isApproved ? 'ai-action-approve-btn--done' : ''
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 size={14} aria-hidden="true" />
                                  <span>Added to Itinerary</span>
                                </>
                              ) : (
                                <>
                                  <span>Approve &amp; Add</span>
                                  <ChevronRight size={14} aria-hidden="true" />
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <span className="ai-msg-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="ai-message-row ai-message-row--assistant">
              <div className="ai-msg-avatar" aria-hidden="true">
                <Sparkles size={16} />
              </div>
              <div className="ai-message-content ai-thinking-bubble">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-thinking-text">Querying verified tools &amp; places…</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form
          className="ai-drawer-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
        >
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Ask about weather, places, itinerary, or safety…"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={chatMutation.isPending}
            aria-label="Ask TripSOS Travel Assistant"
          />
          <button
            type="submit"
            className="ai-chat-send-btn"
            disabled={!inputMessage.trim() || chatMutation.isPending}
            aria-label="Send message to assistant"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
