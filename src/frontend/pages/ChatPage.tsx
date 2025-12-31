import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Messages } from '../components/messages/Messages';
import {
  STARTER_QUESTIONS,
  QUESTIONS_BY_TRADITION,
} from '../../constants/questions';
import { TRADITION_GROUP_MAP } from '../../constants/traditions';
import { ThemeToggle } from '../components/ThemeToggle';
import { ChatInput } from '../components/ChatInput';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { ChatSettingsModal } from '../components/ChatSettingsModal';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { PHILOSOPHERS } from '../../constants/philosophers';

// Utility to shuffle and limit questions
function getRandomQuestions(questions: string[], limit: number): string[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

// URL utilities
function getConversationIdFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/c\/([a-f0-9-]+)$/i);
  return match?.[1] ?? null;
}

function setConversationIdInUrl(id: string | null) {
  const newPath = id ? `/c/${id}` : '/';
  if (window.location.pathname !== newPath) {
    window.history.pushState({}, '', newPath);
  }
}

export function ChatPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string | null>(
    null
  );
  const settingsButtonRef = React.useRef<HTMLButtonElement>(null);

  // Get random starter questions based on selected philosopher
  const randomQuestions = useMemo(() => {
    let questionsPool: string[] = [];

    if (selectedPhilosopher) {
      // If a philosopher is selected, get tradition-specific questions
      const philosopher = PHILOSOPHERS[selectedPhilosopher];
      if (philosopher) {
        // Map the philosopher's tradition to a display group
        const displayGroup = TRADITION_GROUP_MAP[philosopher.tradition];

        // Get questions for that tradition, or fall back to general
        if (displayGroup && QUESTIONS_BY_TRADITION[displayGroup]) {
          questionsPool = QUESTIONS_BY_TRADITION[displayGroup];
        } else {
          questionsPool = STARTER_QUESTIONS;
        }
      }
    } else {
      // If no philosopher selected, combine all questions from all traditions
      questionsPool = [
        ...STARTER_QUESTIONS,
        ...Object.values(QUESTIONS_BY_TRADITION).flat(),
      ];
    }

    return getRandomQuestions(questionsPool, 15);
  }, [selectedPhilosopher]);

  // Conversation management
  const {
    conversations,
    currentConversation,
    createConversation,
    loadConversation,
    saveMessages,
    updateTitle,
    deleteConversation,
    clearCurrentConversation,
  } = useConversations();

  // Use the AI SDK's useChat hook
  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/agent',
      headers: (): Record<string, string> => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
        return {};
      },
      body: () => ({
        philosopherId: selectedPhilosopher,
      }),
    }),
    onError: err => {
      const errorText =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          parts: [
            { type: 'text', text: `Sorry, something went wrong: ${errorText}` },
          ],
        } as any,
      ]);
    },
  });

  const { scrollContainerRef, handleScroll, enableAutoScroll } = useAutoScroll(
    messages,
    currentConversation?.id
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  const isProcessing = status === 'submitted' || status === 'streaming';

  // Load conversation from URL on mount
  useEffect(() => {
    const loadFromUrl = async () => {
      const urlConversationId = getConversationIdFromUrl();
      if (urlConversationId) {
        const conversation = await loadConversation(urlConversationId);
        if (conversation?.messages) {
          const chatMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
          }));
          setMessages(chatMessages as any);
        }
      }
      setInitialLoadDone(true);
    };
    loadFromUrl();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = async () => {
      const urlConversationId = getConversationIdFromUrl();
      if (urlConversationId) {
        const conversation = await loadConversation(urlConversationId);
        if (conversation?.messages) {
          const chatMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
          }));
          setMessages(chatMessages as any);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
        clearCurrentConversation();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadConversation, setMessages, clearCurrentConversation]);

  // Sync URL when conversation changes
  useEffect(() => {
    if (!initialLoadDone) return;
    setConversationIdInUrl(currentConversation?.id || null);
  }, [currentConversation?.id, initialLoadDone]);

  // Convert useChat messages to conversation format for saving
  const convertMessagesForSaving = useCallback(() => {
    return messages.map(msg => ({
      id: crypto.randomUUID(), // AI SDK uses non-UUID IDs, generate UUID for database
      role: msg.role as 'user' | 'assistant',
      content:
        msg.parts
          ?.filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('') || '',
      timestamp: new Date().toISOString(),
      parts: msg.parts,
    }));
  }, [messages]);

  // Auto-save messages when they change (debounced)
  const messageIds = messages.map(m => m.id).join(',');
  useEffect(() => {
    if (!currentConversation || messages.length === 0 || isProcessing) return;

    const timeout = setTimeout(() => {
      saveMessages(convertMessagesForSaving());
    }, 1000);

    return () => clearTimeout(timeout);
  }, [messageIds, currentConversation?.id, isProcessing]);

  // Auto-generate title from first user message
  useEffect(() => {
    if (
      currentConversation &&
      currentConversation.title === 'New Conversation' &&
      messages.length > 0
    ) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        const content =
          firstUserMessage.parts
            ?.filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('') || '';
        if (content) {
          const title =
            content.length > 50 ? content.slice(0, 50) + '...' : content;
          updateTitle(currentConversation.id, title);
        }
      }
    }
  }, [messages, currentConversation, updateTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // Create a new conversation if none exists
    if (!currentConversation) {
      await createConversation();
    }

    const messageContent = input;
    setInput('');
    enableAutoScroll();

    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: messageContent }],
    } as any);
  };

  const handleStarterQuestion = async (question: string) => {
    if (isProcessing) return;

    // Create a new conversation if none exists
    if (!currentConversation) {
      await createConversation();
    }

    enableAutoScroll();

    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: question }],
    } as any);
  };

  const handleNewConversation = async () => {
    setMessages([]);
    await createConversation();
  };

  const handleSelectConversation = async (id: string) => {
    const conversation = await loadConversation(id);
    if (conversation?.messages) {
      // Convert saved messages back to useChat format
      const chatMessages = conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts || [{ type: 'text', text: msg.content }],
      }));
      setMessages(chatMessages as any);
    } else {
      setMessages([]);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (currentConversation?.id === id) {
      setMessages([]);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    clearCurrentConversation();
  };

  const handleRegenerateLastMessage = useCallback(() => {
    if (messages.length < 1 || isProcessing) return;

    // Find the last user message
    let lastUserMessage = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && msg.role === 'user') {
        lastUserMessage = msg;
        break;
      }
    }

    if (!lastUserMessage) {
      console.warn('No user message found to regenerate');
      return;
    }

    // Extract message content
    const messageContent =
      lastUserMessage.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('') || '';

    if (!messageContent) {
      console.warn('No message content found');
      return;
    }

    // Enable auto-scroll for the new response
    enableAutoScroll();

    // Resend the last user message (keeping all previous messages)
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: messageContent }],
    } as any);
  }, [messages, isProcessing, enableAutoScroll, sendMessage]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="py-22">
        <Logo />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const MenuButton = () => (
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      title="Conversations"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );

  const Clear = ({ small = false }: { small?: boolean }) => {
    return (
      <button
        onClick={handleClearConversation}
        disabled={isProcessing}
        className={`flex items-center justify-center ${small ? 'w-7 h-7' : 'w-9 h-9'} bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        title="New Chat"
      >
        <svg
          width={small ? '16' : '18'}
          height={small ? '16' : '18'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    );
  };

  const PhilosopherButton = () => (
    <button
      ref={settingsButtonRef}
      onClick={() => setSettingsOpen(true)}
      disabled={isProcessing}
      className="flex items-center justify-center p-2 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      title="Focus philosopher"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );

  const AboutButton = () => (
    <a
      href="/about"
      className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      title="About - View indexed philosophers"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </a>
  );

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={updateTitle}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div className="border-b border-border bg-surface">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MenuButton />
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && <Clear />}
              <PhilosopherButton />
              <AboutButton />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="flex flex-col max-w-3xl mx-auto px-4">
            <Messages
              messages={messages}
              status={status}
              starterQuestions={randomQuestions}
              onStarterQuestion={handleStarterQuestion}
              onRegenerateLastMessage={handleRegenerateLastMessage}
              selectedPhilosopher={selectedPhilosopher}
              philosopherName={
                selectedPhilosopher
                  ? PHILOSOPHERS[selectedPhilosopher]?.name
                  : null
              }
            />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-surface">
          <div className="relative max-w-3xl mx-auto px-4 py-4">
            {messages.length > 0 && (
              <div className="absolute -top-10 left-4 pb-[7px]">
                <Clear small />
              </div>
            )}
            <ChatInput
              input={input}
              isProcessing={isProcessing}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              selectedPhilosopher={selectedPhilosopher}
              philosopherName={
                selectedPhilosopher
                  ? PHILOSOPHERS[selectedPhilosopher]?.name
                  : null
              }
            />
          </div>
        </div>

        {/* Settings Modal */}
        <ChatSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          selectedPhilosopher={selectedPhilosopher}
          onSelectPhilosopher={setSelectedPhilosopher}
          anchorRef={settingsButtonRef}
        />
      </div>
    </div>
  );
}
