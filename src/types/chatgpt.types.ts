/**
 * ChatGPT DOM Types
 *
 * TypeScript type definitions for ChatGPT DOM elements and structures.
 * These types provide type safety for DOM manipulation and message identification.
 */

/**
 * Extended HTMLElement interface for ChatGPT message elements
 * Provides type safety for message-specific attributes and operations
 */
export interface MessageElement extends HTMLElement {
  /**
   * Message text content (for testing purposes)
   */
  textContent: string;
}

/**
 * Conversation information structure
 */
export interface ConversationInfo {
  /** Unique conversation identifier */
  id: string;
  /** Conversation URL */
  url: string;
  /** Optional conversation title */
  title?: string;
}

/**
 * ChatGPT message metadata
 */
export interface MessageMetadata {
  /** Message unique identifier */
  messageId: string;
  /** Conversation ID this message belongs to */
  conversationId: string;
  /** Message position in conversation (0-based) */
  position: number;
  /** Message author (user/assistant/system) */
  author: 'user' | 'assistant' | 'system';
  /** Message timestamp */
  timestamp?: string;
}

/**
 * DOM selector configuration for ChatGPT elements
 */
export interface DOMSelectors {
  /** Message container selectors */
  message: {
    /** Primary message container selector */
    container: string;
    /** Message content selector */
    content: string;
    /** Message author/avatar selector */
    author: string;
    /** Message timestamp selector */
    timestamp: string;
  };

  /** Action menu selectors */
  actions: {
    /** Action menu container selector */
    container: string;
    /** Individual action button selector */
    button: string;
  };

  /** Conversation selectors */
  conversation: {
    /** Conversation container selector */
    container: string;
    /** Conversation ID selector */
    id: string;
    /** Conversation title selector */
    title: string;
  };
}

/**
 * Fallback selector configuration
 */
export interface FallbackSelectors {
  /** Alternative message selectors */
  message: string[];
  /** Alternative content selectors */
  content: string[];
  /** Alternative action selectors */
  actions: string[];
}

/**
 * DOM monitoring configuration
 */
export interface DOMMonitoringConfig {
  /** Debounce delay in milliseconds */
  debounceDelay: number;
  /** Maximum number of observers */
  maxObservers: number;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring: boolean;
}

/**
 * DOM analysis result
 */
export interface DOMAnalysisResult {
  /** Whether analysis was successful */
  success: boolean;
  /** Identified message elements */
  messages: MessageElement[];
  /** Conversation information */
  conversation: ConversationInfo | null;
  /** Used selectors */
  usedSelectors: DOMSelectors;
  /** Analysis timestamp */
  timestamp: number;
  /** Any errors encountered */
  errors: string[];
}