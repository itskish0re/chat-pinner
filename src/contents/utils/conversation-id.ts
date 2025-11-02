/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Conversation ID Utilities
 *
 * Utility functions for detecting and extracting ChatGPT conversation IDs.
 * Provides multiple strategies for conversation identification and tracking.
 */

import type { ConversationInfo } from "../../types/chatgpt.types"
import type { PinData } from "../../types/pin.types"
import { getPinsByConversation } from "./storage-manager"

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

/**
 * Check if a conversation has associated pins
 * @param conversationId Conversation ID to check
 * @returns Promise<boolean> True if conversation has pins
 */
export async function conversationHasPins(
  conversationId: string
): Promise<boolean> {
  try {
    const pins = await getPinsByConversation(conversationId)
    return pins.length > 0
  } catch (error) {
    console.error("Error checking conversation pins:", error)
    return false
  }
}

/**
 * Get all conversation IDs that have associated pins
 * @returns Promise<string[]> Array of conversation IDs with pins
 */
export async function getConversationsWithPins(): Promise<string[]> {
  try {
    // This would require adding a new function to storage-manager to get all conversation IDs
    // For now, we'll use the existing getAllPins function and extract unique conversation IDs
    const { getAllPins } = await import("./storage-manager")
    const allPins = await getAllPins()
    const conversationIds = [
      ...new Set(allPins.map((pin) => pin.conversationId))
    ]
    return conversationIds
  } catch (error) {
    console.error("Error getting conversations with pins:", error)
    return []
  }
}

/**
 * Validate that a conversation ID still corresponds to an accessible ChatGPT conversation
 * @param conversationId Conversation ID to validate
 * @returns Promise<boolean> True if conversation is accessible
 */
export async function validateConversationAccess(
  conversationId: string
): Promise<boolean> {
  try {
    // Check if current page is the target conversation
    const currentConversation = getConversationInfo()
    if (currentConversation?.id === conversationId) {
      return true
    }

    // Try to construct URL for the conversation
    const conversationUrl = `https://chatgpt.com/c/${conversationId}`

    // Check if we can access the conversation (this is a basic check)
    // In a real implementation, you might want to make a network request or use other validation methods
    return conversationId.length > 10 && /^[a-f0-9-]+$/i.test(conversationId)
  } catch (error) {
    console.error("Error validating conversation access:", error)
    return false
  }
}

/**
 * Get conversation information from pin data
 * @param pin Pin data to extract conversation info from
 * @returns ConversationInfo or null if invalid
 */
export function getConversationFromPin(pin: PinData): ConversationInfo | null {
  if (!pin.conversationId) {
    return null
  }

  return {
    id: pin.conversationId,
    url: `https://chatgpt.com/c/${pin.conversationId}`,
    title: `ChatGPT Conversation ${pin.conversationId.substring(0, 8)}...`
  }
}

/**
 * Extract message position from DOM or estimate it
 * @param messageId Message ID to find position for
 * @param conversationId Conversation ID (optional, improves accuracy)
 * @returns Promise<number> Message position (0-based) or -1 if not found
 */
export async function getMessagePosition(
  messageId: string,
  conversationId?: string
): Promise<number> {
  try {
    // Try to find the message in DOM
    const messageElements = document.querySelectorAll(
      '[data-message-id], [data-testid*="message"]'
    )

    for (let i = 0; i < messageElements.length; i++) {
      const element = messageElements[i]
      const elementMessageId =
        element.getAttribute("data-message-id") ||
        element.getAttribute("data-testid")

      if (elementMessageId === messageId) {
        return i
      }
    }

    // If not found in DOM, try to estimate from stored pins
    if (conversationId) {
      const pins = await getPinsByConversation(conversationId, {
        sortBy: "position"
      })
      const pin = pins.find((p) => p.messageId === messageId)
      return pin?.position ?? -1
    }

    return -1
  } catch (error) {
    console.error("Error getting message position:", error)
    return -1
  }
}

/**
 * Create a stable conversation ID from various sources
 * @param sources Object containing potential ID sources
 * @returns string Stable conversation ID or null
 */
export function createStableConversationId(sources: {
  url?: string
  domElement?: Element
  title?: string
  fallback?: string
}): string | null {
  // Try URL-based ID first (most reliable)
  if (sources.url) {
    const urlId = extractConversationIdFromURL(sources.url)
    if (urlId) return urlId
  }

  // Try DOM-based ID
  if (sources.domElement) {
    const domId =
      sources.domElement.getAttribute("data-conversation-id") ||
      sources.domElement.getAttribute("data-thread-id") ||
      sources.domElement.getAttribute("data-chat-id")
    if (domId) return domId
  }

  // Try title-based ID
  if (sources.title) {
    const titleId = sources.title.match(/([a-f0-9-]{36,})/i)?.[1]
    if (titleId) return titleId
  }

  // Use fallback
  if (sources.fallback) {
    return sources.fallback
  }

  return null
}

/**
 * Monitor conversations with pins for cleanup opportunities
 * @param callback Callback called when orphaned pins are detected
 * @returns Cleanup function to stop monitoring
 */
export function monitorOrphanedPins(
  callback: (orphanedPins: PinData[]) => void
): () => void {
  let lastKnownConversations = new Set<string>()

  const checkForOrphanedPins = async () => {
    try {
      // Get current accessible conversations (this is a simplified approach)
      const currentConversation = getConversationInfo()
      const accessibleConversations = new Set<string>()

      if (currentConversation?.id) {
        accessibleConversations.add(currentConversation.id)
      }

      // Get all conversations with pins
      const conversationsWithPins = await getConversationsWithPins()

      // Find orphaned conversations (have pins but not accessible)
      const orphanedConversationIds = conversationsWithPins.filter(
        (id) => !accessibleConversations.has(id)
      )

      if (orphanedConversationIds.length > 0) {
        // Get pins for orphaned conversations
        const { getAllPins } = await import("./storage-manager")
        const allPins = await getAllPins()
        const orphanedPins = allPins.filter((pin) =>
          orphanedConversationIds.includes(pin.conversationId)
        )

        if (orphanedPins.length > 0) {
          callback(orphanedPins)
        }
      }

      lastKnownConversations = accessibleConversations
    } catch (error) {
      console.error("Error checking for orphaned pins:", error)
    }
  }

  // Initial check
  checkForOrphanedPins()

  // Set up periodic monitoring
  const checkInterval: NodeJS.Timeout = setInterval(checkForOrphanedPins, 60000) // Check every minute

  // Return cleanup function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval)
    }
  }
}

/**
 * Associate pins with current conversation context
 * @param pins Array of pins to associate
 * @returns Promise<PinData[]> Pins with updated context information
 */
export async function associatePinsWithCurrentContext(
  pins: PinData[]
): Promise<PinData[]> {
  try {
    const currentConversation = getConversationInfo()

    if (!currentConversation) {
      return pins
    }

    // Update pins that belong to current conversation with latest context
    return pins.map((pin) => {
      if (pin.conversationId === currentConversation.id) {
        // Update URL if it has changed
        if (pin.messageUrl && pin.messageUrl !== currentConversation.url) {
          return {
            ...pin,
            messageUrl: currentConversation.url
          }
        }
      }
      return pin
    })
  } catch (error) {
    console.error("Error associating pins with current context:", error)
    return pins
  }
}
