# API Integration

For ChatPinner's browser extension architecture, API integration focuses on ChatGPT DOM interaction rather than external APIs. The extension operates entirely client-side, integrating with ChatGPT's existing interface through content script injection and DOM manipulation.

### Service Template

```typescript
/**
 * chatgpt-dom-service.ts
 *
 * Service for interacting with ChatGPT's DOM structure.
 * Handles message detection, conversation monitoring, and UI element targeting.
 */
import { MessageElement, ConversationInfo, ChatGPTElement } from '../types/extension.types';
import { debounce } from '../utils/performance';

export class ChatGPTDOMService {
  private observer: MutationObserver | null = null;
  private messageCache = new Map<string, MessageElement>();
  private conversationListeners: Set<(conversation: ConversationInfo | null) => void> = new Set();
  private messageListeners: Set<(messages: MessageElement[]) => void> = new Set();
  private currentConversation: ConversationInfo | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize DOM monitoring and conversation detection
   */
  private async initialize(): Promise<void> {
    // Wait for ChatGPT page to be ready
    await this.waitForChatGPTReady();

    // Start monitoring for conversation changes
    this.startConversationMonitoring();

    // Start monitoring for message changes
    this.startMessageMonitoring();

    // Initial conversation detection
    this.detectCurrentConversation();
  }

  /**
   * Wait for ChatGPT interface to be ready
   */
  private async waitForChatGPTReady(): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkReady = () => {
        const chatInterface = document.querySelector('[data-testid="conversation-turn"]');
        const messageContainer = document.querySelector('[data-message-container]');

        if (chatInterface || messageContainer) {
          resolve();
        } else if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('ChatGPT interface not ready after timeout'));
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  /**
   * Subscribe to conversation changes
   */
  public onConversationChange(callback: (conversation: ConversationInfo | null) => void): () => void {
    this.conversationListeners.add(callback);
    return () => this.conversationListeners.delete(callback);
  }

  /**
   * Subscribe to message changes
   */
  public onMessageChange(callback: (messages: MessageElement[]) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Get current conversation information
   */
  public getCurrentConversation(): ConversationInfo | null {
    return this.currentConversation;
  }

  /**
   * Check if we're on a ChatGPT conversation page
   */
  public isChatGPTConversation(): boolean {
    return window.location.hostname.includes('chatgpt.com') &&
           (window.location.pathname.includes('/c/') ||
            this.getMessageCount() > 0);
  }

  /**
   * Find message by ID
   */
  public findMessageById(messageId: string): MessageElement | null {
    // Try cache first
    const cached = this.messageCache.get(messageId);
    if (cached) return cached;

    // Try DOM query
    const element = document.querySelector(`[data-message-id="${messageId}"]`) as MessageElement;
    if (element) {
      this.cacheMessage(element);
      return element;
    }

    return null;
  }

  /**
   * Get message content from element
   */
  public getMessageContent(element: MessageElement): string {
    const contentSelectors = [
      '[data-message-content]',
      '.message-content',
      '.prose',
      '[class*="content"]',
      '[class*="text"]'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement && contentElement.textContent) {
        return contentElement.textContent.trim().slice(0, 500); // Limit length
      }
    }

    // Fallback to element text content
    return element.textContent?.trim().slice(0, 500) || '';
  }

  /**
   * Find message action menu for a given message
   */
  public findMessageActionMenu(element: MessageElement): Element | null {
    // Look for action menu within message or its immediate siblings
    const actionMenuSelectors = [
      '[data-testid="message-actions"]',
      '.message-actions',
      '.action-menu',
      '[class*="action"]',
      '[class*="menu"]'
    ];

    // First check within the message element
    for (const selector of actionMenuSelectors) {
      const menu = element.querySelector(selector);
      if (menu) return menu;
    }

    // Then check siblings and parent elements
    let parent = element.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      for (const selector of actionMenuSelectors) {
        const menu = parent.querySelector(selector);
        if (menu) return menu;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * Clean up observers and listeners
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.conversationListeners.clear();
    this.messageListeners.clear();
    this.messageCache.clear();
    this.currentConversation = null;
  }

  // Additional private methods for DOM monitoring and conversation detection...
}
```

---
