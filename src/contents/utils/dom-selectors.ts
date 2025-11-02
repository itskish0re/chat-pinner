/**
 * ChatGPT DOM Selectors
 *
 * Stable CSS selectors and data attributes for targeting ChatGPT DOM elements.
 * Prioritizes data attributes over CSS classes for stability across ChatGPT updates.
 */

import type { DOMSelectors, FallbackSelectors } from "../../types/chatgpt.types"

/**
 * Primary DOM selectors for ChatGPT elements
 * These selectors prioritize data attributes and semantic HTML elements
 */
export const CHATGPT_SELECTORS: DOMSelectors = {
  message: {
    /**
     * Primary message container selector
     * Uses data-testid which is more stable than CSS classes
     */
    container:
      '[data-testid="conversation-turn-0"], [data-message-id], [data-testid^="conversation-turn-"]',

    /**
     * Message content selector
     * Targets the main content area of messages
     */
    content:
      '[data-message-content], .prose, .whitespace-pre-wrap, [class*="markdown"]',

    /**
     * Message author/avatar selector
     * Targets the author information for each message
     */
    author:
      '[data-testid="conversation-turn-author"], [class*="avatar"], [class*="author"]',

    /**
     * Message timestamp selector
     * Targets the timestamp information
     */
    timestamp:
      '[data-testid="conversation-turn-time"], [class*="time"], [class*="timestamp"]'
  },

  actions: {
    /**
     * Action menu container selector
     * Targets the container that holds action buttons
     */
    container:
      '[data-testid="conversation-turn-actions"], [class*="actions"], [class*="menu"]',

    /**
     * Individual action button selector
     * Targets action buttons within the action menu
     */
    button:
      '[role="button"], [aria-label], button, [class*="action"], [class*="button"]'
  },

  conversation: {
    /**
     * Conversation container selector
     * Targets the main conversation container
     */
    container:
      '[data-testid="conversation-turn"], [class*="conversation"], main, [role="main"]',

    /**
     * Conversation ID selector
     * Attempts to extract conversation ID from various sources
     */
    id: "[data-conversation-id], [data-thread-id], [data-chat-id]",

    /**
     * Conversation title selector
     * Targets the conversation title element
     */
    title:
      '[data-testid="conversation-title"], h1, [class*="title"], [class*="header"]'
  }
}

/**
 * Fallback selectors for robustness
 * These provide alternative selectors when primary ones fail
 */
export const FALLBACK_SELECTORS: FallbackSelectors = {
  /**
   * Alternative message selectors
   */
  message: [
    'div[class*="message"]',
    'div[class*="turn"]',
    'div[class*="conversation"]',
    "article",
    'section[class*="message"]'
  ],

  /**
   * Alternative content selectors
   */
  content: [
    ".text-base",
    ".prose",
    ".markdown",
    '[class*="content"]',
    '[class*="text"]',
    "p",
    'div[class*="whitespace"]'
  ],

  /**
   * Alternative action selectors
   */
  actions: [
    '[class*="flex"][class*="gap"]',
    '[class*="absolute"][class*="right"]',
    'div[role="toolbar"]',
    "nav",
    '[class*="dropdown"]'
  ]
}

/**
 * Utility function to test selector validity
 * @param selector CSS selector to test
 * @returns Whether the selector is valid and finds elements
 */
export const testSelector = (selector: string): boolean => {
  try {
    const elements = document.querySelectorAll(selector)
    return elements && elements.length > 0
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error)
    return false
  }
}

/**
 * Test all primary selectors and return working ones
 * @returns Object with only working selectors
 */
export const getWorkingSelectors = (): Partial<DOMSelectors> => {
  const working: Partial<DOMSelectors> = {}

  // Test message selectors
  working.message = {
    container: testSelector(CHATGPT_SELECTORS.message.container)
      ? CHATGPT_SELECTORS.message.container
      : FALLBACK_SELECTORS.message.find((s) => testSelector(s)) || "",
    content: testSelector(CHATGPT_SELECTORS.message.content)
      ? CHATGPT_SELECTORS.message.content
      : FALLBACK_SELECTORS.content.find((s) => testSelector(s)) || "",
    author: testSelector(CHATGPT_SELECTORS.message.author)
      ? CHATGPT_SELECTORS.message.author
      : FALLBACK_SELECTORS.message.find((s) => testSelector(s)) || "",
    timestamp: testSelector(CHATGPT_SELECTORS.message.timestamp)
      ? CHATGPT_SELECTORS.message.timestamp
      : FALLBACK_SELECTORS.message.find((s) => testSelector(s)) || ""
  }

  // Test action selectors
  working.actions = {
    container: testSelector(CHATGPT_SELECTORS.actions.container)
      ? CHATGPT_SELECTORS.actions.container
      : FALLBACK_SELECTORS.actions.find((s) => testSelector(s)) || "",
    button: testSelector(CHATGPT_SELECTORS.actions.button)
      ? CHATGPT_SELECTORS.actions.button
      : FALLBACK_SELECTORS.actions.find((s) => testSelector(s)) || ""
  }

  // Test conversation selectors
  working.conversation = {
    container: testSelector(CHATGPT_SELECTORS.conversation.container)
      ? CHATGPT_SELECTORS.conversation.container
      : FALLBACK_SELECTORS.message.find((s) => testSelector(s)) || "",
    id: testSelector(CHATGPT_SELECTORS.conversation.id)
      ? CHATGPT_SELECTORS.conversation.id
      : "",
    title: testSelector(CHATGPT_SELECTORS.conversation.title)
      ? CHATGPT_SELECTORS.conversation.title
      : ""
  }

  return working
}

/**
 * Extract message ID from element using multiple strategies
 * @param element Message element to extract ID from
 * @returns Message ID or null if not found
 */
export const extractMessageId = (element: Element): string | null => {
  // Try data attributes first (most stable)
  const dataId =
    element.getAttribute("data-message-id") ||
    element.getAttribute("data-testid") ||
    element.getAttribute("data-conversation-turn-id") ||
    element.getAttribute("id")

  if (dataId) {
    return dataId
  }

  // Try to extract from class names
  const classList = Array.from(element.classList)
  const idClass = classList.find(
    (cls) =>
      cls.includes("message") ||
      cls.includes("turn") ||
      cls.includes("conversation")
  )

  return idClass || null
}

/**
 * Extract conversation ID from page
 * @returns Conversation ID or null if not found
 */
export const extractConversationId = (): string | null => {
  // Try URL-based extraction
  const urlMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  // Try DOM-based extraction
  const conversationElement = document.querySelector(
    CHATGPT_SELECTORS.conversation.id
  )

  if (conversationElement) {
    return (
      conversationElement.getAttribute("data-conversation-id") ||
      conversationElement.getAttribute("data-thread-id") ||
      conversationElement.getAttribute("data-chat-id")
    )
  }

  return null
}
