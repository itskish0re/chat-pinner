/**
 * useChatGPTDOM Hook
 *
 * Custom React hook for ChatGPT DOM analysis, message detection, and identification.
 * Provides utilities for monitoring ChatGPT conversations and extracting message data.
 */

import { useCallback, useEffect, useRef, useState } from "react"

import type {
  ConversationInfo,
  DOMAnalysisResult,
  DOMMonitoringConfig,
  DOMSelectors,
  MessageElement,
  MessageMetadata
} from "../../types/chatgpt.types"
import {
  // CHATGPT_SELECTORS,
  extractConversationId,
  extractMessageId,
  getWorkingSelectors
} from "../utils/dom-selectors"

/**
 * Configuration for DOM monitoring
 */
const MONITORING_CONFIG: DOMMonitoringConfig = {
  debounceDelay: 100,
  maxObservers: 5,
  enablePerformanceMonitoring: true
}

/**
 * Custom hook for ChatGPT DOM analysis and monitoring
 * @returns Object with DOM utilities and state
 */
export const useChatGPTDOM = () => {
  const [messages, setMessages] = useState<MessageElement[]>([])
  const [conversation, setConversation] = useState<ConversationInfo | null>(
    null
  )
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [workingSelectors, setWorkingSelectors] = useState(
    getWorkingSelectors()
  )

  // Refs for performance and cleanup
  const observerRef = useRef<MutationObserver | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messageCacheRef = useRef<Map<string, MessageElement>>(new Map())

  /**
   * Debounced function to scan for messages
   */
  const scanForMessages = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const selectors = getWorkingSelectors()
      setWorkingSelectors(selectors)

      if (!selectors.message?.container) {
        console.warn("No working message container selector found")
        return
      }

      const messageElements = document.querySelectorAll(
        selectors.message.container
      )
      const validMessages: MessageElement[] = []

      messageElements.forEach((element) => {
        const messageId = extractMessageId(element)
        if (messageId && !messageCacheRef.current.has(messageId)) {
          // Type assertion for extended HTMLElement
          const messageElement = element as MessageElement
          messageCacheRef.current.set(messageId, messageElement)
          validMessages.push(messageElement)
        }
      })

      if (validMessages.length > 0) {
        setMessages((prev) => [...prev, ...validMessages])
      }

      // Update conversation info
      const conversationId = extractConversationId()
      if (conversationId) {
        setConversation({
          id: conversationId,
          url: window.location.href,
          title: document.title || "ChatGPT Conversation"
        })
      }

      setIsReady(true)
    }, MONITORING_CONFIG.debounceDelay)
  }, [])

  /**
   * Extract message metadata from a message element
   * @param messageElement Message element to analyze
   * @returns Message metadata or null if extraction fails
   */
  const extractMessageMetadata = useCallback(
    (messageElement: MessageElement): MessageMetadata | null => {
      const messageId = extractMessageId(messageElement)
      if (!messageId) {
        return null
      }

      const conversationId = extractConversationId()
      if (!conversationId) {
        return null
      }

      // Find message position in conversation
      const allMessages = document.querySelectorAll(
        workingSelectors.message?.container || ""
      )
      const position = Array.from(allMessages).indexOf(messageElement)

      // Try to extract author information
      let author: "user" | "assistant" | "system" = "assistant"
      const authorElement = messageElement.querySelector(
        workingSelectors.message?.author || ""
      )
      if (authorElement) {
        const authorText = authorElement.textContent?.toLowerCase() || ""
        if (authorText.includes("you") || authorText.includes("user")) {
          author = "user"
        } else if (authorText.includes("system")) {
          author = "system"
        }
      }

      // Try to extract timestamp
      let timestamp: string | undefined
      const timestampElement = messageElement.querySelector(
        workingSelectors.message?.timestamp || ""
      )
      if (timestampElement) {
        timestamp = timestampElement.textContent?.trim() || undefined
      }

      return {
        messageId,
        conversationId,
        position,
        author,
        timestamp
      }
    },
    [workingSelectors]
  )

  /**
   * Get message content from a message element
   * @param messageElement Message element to extract content from
   * @returns Message content text or empty string
   */
  const getMessageContent = useCallback(
    (messageElement: MessageElement): string => {
      const contentSelectors = [
        workingSelectors.message?.content,
        ".prose",
        ".whitespace-pre-wrap",
        '[class*="markdown"]',
        '[class*="content"]',
        "p"
      ].filter(Boolean)

      for (const selector of contentSelectors) {
        const contentElement = messageElement.querySelector(selector || "")
        if (contentElement && contentElement.textContent) {
          return contentElement.textContent.trim().slice(0, 500) // Limit length
        }
      }

      return messageElement.textContent?.trim().slice(0, 500) || ""
    },
    [workingSelectors]
  )

  /**
   * Find message by ID
   * @param messageId Message ID to find
   * @returns Message element or null if not found
   */
  const findMessageById = useCallback(
    (messageId: string): MessageElement | null => {
      // Try cache first
      const cached = messageCacheRef.current.get(messageId)
      if (cached) return cached

      // Try DOM query
      const element = document.querySelector(
        `[data-message-id="${messageId}"], [data-testid="${messageId}"]`
      )
      if (element) {
        const messageElement = element as MessageElement
        messageCacheRef.current.set(messageId, messageElement)
        return messageElement
      }

      return null
    },
    []
  )

  /**
   * Start monitoring the DOM for changes
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring || !workingSelectors.message?.container) {
      return
    }

    setIsMonitoring(true)

    // Create MutationObserver
    observerRef.current = new MutationObserver((mutations) => {
      let shouldScan = false

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          // Check if any added nodes contain message elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (
                element.matches(workingSelectors.message?.container || "") ||
                element.querySelector(workingSelectors.message?.container || "")
              ) {
                shouldScan = true
              }
            }
          })
        }
      })

      if (shouldScan) {
        scanForMessages()
      }
    })

    // Start observing the conversation container
    const conversationContainer = document.querySelector(
      workingSelectors.conversation?.container || "main, body"
    )

    if (conversationContainer) {
      observerRef.current.observe(conversationContainer, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      })
    }

    // Initial scan
    scanForMessages()
  }, [isMonitoring, workingSelectors, scanForMessages])

  /**
   * Stop monitoring the DOM
   */
  const stopMonitoring = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    setIsMonitoring(false)
  }, [])

  /**
   * Analyze the current DOM state
   * @returns Complete DOM analysis result
   */
  const analyzeDOM = useCallback((): DOMAnalysisResult => {
    const errors: string[] = []
    const selectors = getWorkingSelectors()

    if (!selectors.message?.container) {
      errors.push("No working message container selector found")
    }

    if (!selectors.conversation?.container) {
      errors.push("No working conversation container selector found")
    }

    const conversationId = extractConversationId()
    if (!conversationId) {
      errors.push("Could not extract conversation ID")
    }

    const conversationInfo: ConversationInfo | null = conversationId
      ? {
          id: conversationId,
          url: window.location.href,
          title: document.title || "ChatGPT Conversation"
        }
      : null

    const messageElements = selectors.message?.container
      ? (Array.from(
          document.querySelectorAll(selectors.message.container)
        ) as MessageElement[])
      : []

    return {
      success: errors.length === 0,
      messages: messageElements,
      conversation: conversationInfo,
      usedSelectors: selectors as DOMSelectors,
      timestamp: Date.now(),
      errors
    }
  }, [])

  // Initialize and cleanup
  useEffect(() => {
    // Initial analysis
    const analysis = analyzeDOM()
    setIsReady(analysis.success)
    setMessages(analysis.messages)
    setConversation(analysis.conversation)

    // Start monitoring if analysis was successful
    if (analysis.success) {
      startMonitoring()
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring()
      messageCacheRef.current.clear()
    }
  }, [])

  return {
    // State
    messages,
    conversation,
    isReady,
    isMonitoring,
    workingSelectors,

    // Utilities
    extractMessageMetadata,
    getMessageContent,
    findMessageById,
    analyzeDOM,

    // Control
    startMonitoring,
    stopMonitoring,
    scanForMessages
  }
}
