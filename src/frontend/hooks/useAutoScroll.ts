import { useRef, useEffect, useCallback } from 'react';

const AUTO_SCROLL_THRESHOLD = 50;

export function useAutoScroll<T>(
  dependency: T,
  conversationId?: string | null
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const userScrollingRef = useRef(false);
  const lastConversationIdRef = useRef<string | null | undefined>(undefined);
  const isStreamingRef = useRef(false);

  const scrollToBottom = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (shouldAutoScrollRef.current && !userScrollingRef.current && container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? 'instant' : 'smooth',
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > AUTO_SCROLL_THRESHOLD) {
      shouldAutoScrollRef.current = false;
      userScrollingRef.current = true;
    } else {
      shouldAutoScrollRef.current = true;
      userScrollingRef.current = false;
    }
  }, []);

  const enableAutoScroll = useCallback(() => {
    shouldAutoScrollRef.current = true;
    userScrollingRef.current = false;
    isStreamingRef.current = true;
  }, []);

  // Handle conversation changes - reset flags and scroll
  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId;
      // Reset auto-scroll flags when conversation changes
      shouldAutoScrollRef.current = true;
      userScrollingRef.current = false;

      // Scroll to bottom for new conversation after delay
      const hasMessages =
        Array.isArray(dependency) && (dependency as any[]).length > 0;
      if (hasMessages) {
        setTimeout(() => {
          scrollToBottom(false);
        }, 100);
      }
    }
  }, [conversationId, dependency, scrollToBottom]);

  // Handle message updates (smooth scroll during streaming)
  useEffect(() => {
    if (isStreamingRef.current) {
      scrollToBottom(false);
    }
  }, [dependency, scrollToBottom]);

  return {
    scrollContainerRef,
    handleScroll,
    enableAutoScroll,
  };
}
