import { useRef, useEffect, useCallback } from 'react';

const AUTO_SCROLL_THRESHOLD = 50;

export function useAutoScroll<T>(
  dependency: T,
  conversationId?: string | null,
  status?: string
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastConversationIdRef = useRef<string | null | undefined>(undefined);
  const isStreamingRef = useRef(false);
  const needsInitialScrollRef = useRef(false);
  const wasStreamingRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (shouldAutoScrollRef.current && container) {
      // Mark this as a programmatic scroll
      isProgrammaticScrollRef.current = true;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? 'instant' : 'smooth',
      });
      lastScrollHeightRef.current = container.scrollHeight;

      // Reset the flag after scroll completes
      // Use longer timeout for smooth scrolling to ensure it completes
      scrollTimeoutRef.current = setTimeout(
        () => {
          isProgrammaticScrollRef.current = false;
        },
        instant ? 50 : 250
      );
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Ignore scroll events during programmatic scrolling to prevent false positives
    if (isProgrammaticScrollRef.current) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // If user scrolled significantly away from bottom, disable auto-scroll
    if (distanceFromBottom > AUTO_SCROLL_THRESHOLD) {
      shouldAutoScrollRef.current = false;
    } else {
      // Re-enable auto-scroll when user scrolls back near the bottom
      shouldAutoScrollRef.current = true;
    }
  }, []);

  const enableAutoScroll = useCallback(() => {
    shouldAutoScrollRef.current = true;
    isStreamingRef.current = true;
  }, []);

  // Detect conversation changes
  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId;
      needsInitialScrollRef.current = true;
      shouldAutoScrollRef.current = true;
    }
  }, [conversationId]);

  // Scroll when messages load after conversation change
  useEffect(() => {
    const hasMessages =
      Array.isArray(dependency) && (dependency as any[]).length > 0;

    if (needsInitialScrollRef.current && hasMessages && conversationId) {
      needsInitialScrollRef.current = false;

      // Wait for content to render, including MessageActions buttons
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const container = scrollContainerRef.current;
            if (container && container.scrollHeight > 0) {
              scrollToBottom(false);
            }
          }, 300);
        });
      });
    }
  }, [dependency, conversationId, scrollToBottom, status]);

  // Handle content height changes (e.g., when MessageActions buttons appear)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !shouldAutoScrollRef.current) return;

    const currentHeight = container.scrollHeight;
    const heightChanged =
      currentHeight !== lastScrollHeightRef.current &&
      lastScrollHeightRef.current > 0;

    // If height increased significantly (e.g., buttons appeared), scroll to show them
    if (heightChanged && currentHeight > lastScrollHeightRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [dependency, status, scrollToBottom]);

  // Handle message updates (smooth scroll during streaming)
  useEffect(() => {
    if (isStreamingRef.current) {
      scrollToBottom(false);
    }
  }, [dependency, scrollToBottom]);

  // Handle streaming completion - scroll when buttons appear
  useEffect(() => {
    const isCurrentlyStreaming =
      status === 'submitted' || status === 'streaming';

    // Detect when streaming just finished
    if (wasStreamingRef.current && !isCurrentlyStreaming) {
      isStreamingRef.current = false;

      // Wait for MessageActions buttons to render, then scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      });
    }

    wasStreamingRef.current = isCurrentlyStreaming;

    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [status, scrollToBottom]);

  return {
    scrollContainerRef,
    handleScroll,
    enableAutoScroll,
  };
}
