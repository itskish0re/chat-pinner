# Routing

For ChatPinner's browser extension architecture, traditional routing is not required since this is a content script that operates within ChatGPT's existing interface. However, we need to handle navigation within ChatGPT conversations and manage the extension's internal state routing.

### Route Configuration

```typescript
/**
 * extension-navigation.ts
 *
 * Navigation system for ChatGPT conversation integration and smooth scrolling.
 * Handles pin navigation, conversation monitoring, and URL state management.
 */
import { MessageElement, NavigationTarget } from '../types/extension.types';
import { ChatGPTIntegration } from './api/chatgpt-integration';

export class ExtensionNavigation {
  private chatGPTIntegration: ChatGPTIntegration;
  private navigationHistory: NavigationTarget[] = [];
  private isNavigating = false;

  constructor(chatGPTIntegration: ChatGPTIntegration) {
    this.chatGPTIntegration = chatGPTIntegration;
    this.initializeNavigation();
  }

  /**
   * Navigate to a specific pin (smooth scroll with highlighting)
   */
  async navigateToPin(messageId: string, options: {
    highlight?: boolean;
    scrollBehavior?: ScrollBehavior;
    timeout?: number;
  } = {}): Promise<boolean> {
    const {
      highlight = true,
      scrollBehavior = 'smooth',
      timeout = 5000
    } = options;

    if (this.isNavigating) {
      return false;
    }

    try {
      this.isNavigating = true;

      // Find the target message
      const targetMessage = this.chatGPTIntegration.findMessage(messageId);
      if (!targetMessage) {
        console.warn(`Message not found: ${messageId}`);
        return false;
      }

      // Calculate scroll position
      const scrollPosition = this.calculateScrollPosition(targetMessage);

      // Smooth scroll to target
      await this.smoothScrollTo(scrollPosition, scrollBehavior);

      // Highlight the message
      if (highlight) {
        await this.highlightMessage(targetMessage);
      }

      // Update navigation history
      this.addToNavigationHistory({
        messageId,
        timestamp: Date.now(),
        scrollPosition,
        conversationId: this.chatGPTIntegration.getCurrentConversation()?.id || null
      });

      return true;
    } catch (error) {
      console.error('Navigation failed:', error);
      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Calculate optimal scroll position for message
   */
  private calculateScrollPosition(targetMessage: MessageElement): number {
    const rect = targetMessage.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Account for sticky headers and any fixed elements
    const headerOffset = this.getHeaderOffset();
    const targetScrollTop = rect.top + scrollTop - headerOffset;

    return Math.max(0, targetScrollTop);
  }

  /**
   * Get the height of fixed/sticky headers that should be avoided
   */
  private getHeaderOffset(): number {
    let offset = 0;

    // Check for ChatGPT's fixed navigation
    const chatGPTNav = document.querySelector('nav') as HTMLElement;
    if (chatGPTNav && chatGPTNav.offsetHeight > 0) {
      offset += chatGPTNav.offsetHeight;
    }

    // Check for our pin header
    const pinHeader = document.querySelector('[data-pin-header]') as HTMLElement;
    if (pinHeader && pinHeader.offsetHeight > 0) {
      offset += pinHeader.offsetHeight;
    }

    return offset + 16; // Add some padding
  }

  /**
   * Smooth scroll to position
   */
  private async smoothScrollTo(position: number, behavior: ScrollBehavior = 'smooth'): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = window.pageYOffset;
      const distance = position - startPosition;
      const duration = behavior === 'smooth' ? 500 : 0;

      if (duration === 0) {
        window.scrollTo(0, position);
        resolve();
        return;
      }

      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeInOutCubic = (t: number): number => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const currentScroll = startPosition + (distance * easeInOutCubic(progress));
        window.scrollTo(0, currentScroll);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  }

  /**
   * Highlight a message after navigation
   */
  private async highlightMessage(messageElement: MessageElement): Promise<void> {
    const highlightClass = 'chatpinner-message-highlight';

    // Create highlight styles if they don't exist
    this.createHighlightStyles();

    // Add highlight class
    messageElement.classList.add(highlightClass);

    // Remove highlight after animation
    setTimeout(() => {
      messageElement.classList.remove(highlightClass);
    }, 2000);
  }

  /**
   * Create styles for message highlighting
   */
  private createHighlightStyles(): void {
    const styleId = 'chatpinner-highlight-styles';

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .chatpinner-message-highlight {
          position: relative;
          animation: chatpinner-highlight 2s ease-in-out;
        }

        .chatpinner-message-highlight::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: var(--brand-purple, #ab68ff);
          border-radius: 2px;
          animation: chatpinner-highlight-slide 0.3s ease-out;
        }

        @keyframes chatpinner-highlight {
          0% { background-color: transparent; }
          10% { background-color: var(--main-surface-secondary, #f8f9fa); }
          100% { background-color: transparent; }
        }

        @keyframes chatpinner-highlight-slide {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Additional methods for navigation history, URL state management, etc.
}
```

---
