/**
 * Conversation ID Utilities
 *
 * Utility functions for detecting and extracting ChatGPT conversation IDs.
 * Provides multiple strategies for conversation identification and tracking.
 */

import type { ConversationInfo } from "../../types/chatgpt.types"

/**
 * Extract conversation ID from URL
 * @param url Current page URL (defaults to window.location.href)
 * @returns Conversation ID or null if not found
 */
export const extractConversationIdFromURL = (
  url: string = window.location.href
): string | null => {
  // Pattern 1: /c/[conversation-id] (most common)
  const pattern1 = url.match(/\/c\/([a-f0-9-]{36,})/)
  if (pattern1) {
    return pattern1[1]
  }

  // Pattern 2: ?conversation=[id] (query parameter)
  const pattern2 = url.match(/[?&]conversation=([a-f0-9-]{36,})/)
  if (pattern2) {
    return pattern2[1]
  }

  // Pattern 3: #conversation/[id] (hash fragment)
  const pattern3 = url.match(/#conversation\/([a-f0-9-]{36,})/)
  if (pattern3) {
    return pattern3[1]
  }

  return null
}

/**
 * Extract conversation ID from DOM
 * @returns Conversation ID or null if not found
 */
export const extractConversationIdFromDOM = (): string | null => {
  const selectors = [
    "[data-conversation-id]",
    "[data-thread-id]",
    "[data-chat-id]",
    "[data-session-id]",
    "[data-conversation]"
  ]

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) {
      const id = element.getAttribute(selector.replace(/[[\]]/g, ""))
      if (id) {
        return id
      }
    }
  }

  return null
}

/**
 * Extract conversation ID from page title
 * @returns Conversation ID or null if not found
 */
export const extractConversationIdFromTitle = (): string | null => {
  const title = document.title

  // Look for UUID patterns in title
  const uuidPattern = title.match(/([a-f0-9-]{36,})/i)
  if (uuidPattern) {
    return uuidPattern[1]
  }

  return null
}

/**
 * Generate conversation ID from page content
 * @returns Generated conversation ID or null if cannot generate
 */
export const generateConversationIdFromContent = (): string | null => {
  // Try to extract from first message content
  const firstMessage = document.querySelector(
    '[data-message-id], [class*="message"], [class*="turn"]'
  )
  if (firstMessage) {
    const messageId =
      firstMessage.getAttribute("data-message-id") ||
      firstMessage.getAttribute("data-testid") ||
      firstMessage.id

    if (messageId) {
      return messageId
    }
  }

  // Fallback: generate from URL path
  const path = window.location.pathname
  if (path && path !== "/") {
    // Create hash from path
    let hash = 0
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  return null
}

/**
 * Detect if current page is a ChatGPT conversation
 * @returns True if page appears to be a ChatGPT conversation
 */
export const isChatGPTConversation = (): boolean => {
  // Check hostname
  if (
    !window.location.hostname.includes("chatgpt.com") &&
    !window.location.hostname.includes("chat.openai.com")
  ) {
    return false
  }

  // Check for conversation indicators
  const indicators = [
    () => !!document.querySelector('[data-testid="conversation-turn"]'),
    () => !!document.querySelector("[data-message-id]"),
    () => !!document.querySelector(".prose"),
    () => !!document.querySelector('[class*="conversation"]'),
    () => !!document.querySelector('[class*="message"]'),
    () => !!document.querySelector('form[role="form"]'),
    () => window.location.pathname.includes("/c/"),
    () => document.title.toLowerCase().includes("chatgpt")
  ]

  // Need at least 3 indicators to be confident
  const trueIndicators = indicators.filter((check) => check()).length
  return trueIndicators >= 3
}

/**
 * Get comprehensive conversation information
 * @returns Complete conversation info or null if not a conversation
 */
export const getConversationInfo = (): ConversationInfo | null => {
  if (!isChatGPTConversation()) {
    return null
  }

  // Try different strategies to get conversation ID
  const conversationId =
    extractConversationIdFromURL() ||
    extractConversationIdFromDOM() ||
    extractConversationIdFromTitle() ||
    generateConversationIdFromContent()

  if (!conversationId) {
    return null
  }

  return {
    id: conversationId,
    url: window.location.href,
    title: document.title || "ChatGPT Conversation"
  }
}

/**
 * Monitor conversation changes
 * @param callback Callback function called when conversation changes
 * @returns Cleanup function to stop monitoring
 */
export const monitorConversationChanges = (
  callback: (conversation: ConversationInfo | null) => void
): (() => void) => {
  let lastConversationId: string | null = null

  const checkConversation = () => {
    const currentConversation = getConversationInfo()
    const currentId = currentConversation?.id || null

    if (currentId !== lastConversationId) {
      lastConversationId = currentId
      callback(currentConversation)
    }
  }

  // Initial check
  checkConversation()

  // Set up monitoring
  const interval = setInterval(checkConversation, 1000)

  // Also monitor URL changes
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function (...args) {
    originalPushState.apply(history, args)
    setTimeout(checkConversation, 0)
  }

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args)
    setTimeout(checkConversation, 0)
  }

  window.addEventListener("popstate", checkConversation)

  // Return cleanup function
  return () => {
    clearInterval(interval)
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
    window.removeEventListener("popstate", checkConversation)
  }
}
