import type {
  ChatGPTConversation,
  ChatGPTDOMElements,
  ChatGPTMessage
} from "../../types"

/**
 * Utility functions for interacting with ChatGPT DOM
 */

export function getChatGPTDOMElements(): ChatGPTDOMElements {
  return {
    conversationItems: document.querySelectorAll(
      '[data-testid="conversation-turn"]'
    ),
    currentConversation: document.querySelector(
      '[data-testid="conversation-turn"]'
    ),
    messageElements: document.querySelectorAll("[data-message-author-role]"),
    inputElement: document.getElementById(
      "prompt-textarea"
    ) as HTMLTextAreaElement | null
  }
}

export function extractCurrentConversation(): ChatGPTConversation | null {
  const elements = getChatGPTDOMElements()

  if (!elements.messageElements.length) {
    return null
  }

  const messages: ChatGPTMessage[] = []
  let conversationTitle = "Untitled Chat"

  // Extract title from page if available
  const titleElement = document.querySelector("title")
  if (titleElement) {
    conversationTitle = titleElement.textContent || "Untitled Chat"
  }

  elements.messageElements.forEach((element, index) => {
    const role = element.getAttribute("data-message-author-role") as
      | "user"
      | "assistant"
    const contentElement = element.querySelector(".prose") || element
    const content = contentElement?.textContent?.trim() || ""

    if (content) {
      messages.push({
        id: `msg-${index}`,
        content,
        role,
        timestamp: Date.now()
      })
    }
  })

  return {
    id: generateConversationId(),
    title: conversationTitle,
    messages,
    lastUpdated: Date.now()
  }
}

export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getCurrentChatUrl(): string {
  return window.location.href
}

export function isInChatGPT(): boolean {
  return window.location.hostname.includes("chat.openai.com")
}

export function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector)
      if (element) {
        obs.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

export function observeChatGPTChanges(callback: () => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    let shouldCallback = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // Check if relevant parts of ChatGPT UI changed
        const addedNodes = Array.from(mutation.addedNodes)
        const hasChatChanges = addedNodes.some((node) => {
          if (node instanceof Element) {
            return (
              node.querySelector("[data-message-author-role]") ||
              node.querySelector('[data-testid="conversation-turn"]') ||
              node.matches("[data-message-author-role]") ||
              node.matches('[data-testid="conversation-turn"]')
            )
          }
          return false
        })

        if (hasChatChanges) {
          shouldCallback = true
        }
      }
    })

    if (shouldCallback) {
      // Debounce callback
      setTimeout(callback, 100)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  })

  return observer
}
