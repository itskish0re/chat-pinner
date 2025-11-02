/**
 * DOM Selectors Tests
 *
 * Unit tests for ChatGPT DOM selector utilities and functions.
 */

import {
  CHATGPT_SELECTORS,
  FALLBACK_SELECTORS,
  testSelector,
  getWorkingSelectors,
  extractMessageId,
  extractConversationId
} from '../../../src/contents/utils/dom-selectors';

// Mock DOM environment
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'chatgpt.com',
    pathname: '/c/test-conversation-id',
    href: 'https://chatgpt.com/c/test-conversation-id'
  },
  writable: true
});

// Mock document methods
const mockQuerySelector = jest.fn();
document.querySelector = mockQuerySelector;
document.querySelectorAll = mockQuerySelector;

describe('DOM Selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CHATGPT_SELECTORS', () => {
    test('should have proper structure', () => {
      expect(CHATGPT_SELECTORS).toHaveProperty('message');
      expect(CHATGPT_SELECTORS).toHaveProperty('actions');
      expect(CHATGPT_SELECTORS).toHaveProperty('conversation');

      expect(CHATGPT_SELECTORS.message).toHaveProperty('container');
      expect(CHATGPT_SELECTORS.message).toHaveProperty('content');
      expect(CHATGPT_SELECTORS.message).toHaveProperty('author');
      expect(CHATGPT_SELECTORS.message).toHaveProperty('timestamp');
    });

    test('should prioritize data attributes in selectors', () => {
      expect(CHATGPT_SELECTORS.message.container).toContain('data-testid');
      expect(CHATGPT_SELECTORS.conversation.id).toContain('data-conversation-id');
    });
  });

  describe('FALLBACK_SELECTORS', () => {
    test('should provide alternative selectors', () => {
      expect(FALLBACK_SELECTORS.message).toBeInstanceOf(Array);
      expect(FALLBACK_SELECTORS.content).toBeInstanceOf(Array);
      expect(FALLBACK_SELECTORS.actions).toBeInstanceOf(Array);

      expect(FALLBACK_SELECTORS.message.length).toBeGreaterThan(0);
      expect(FALLBACK_SELECTORS.content.length).toBeGreaterThan(0);
      expect(FALLBACK_SELECTORS.actions.length).toBeGreaterThan(0);
    });
  });

  describe('testSelector', () => {
    test('should return true for valid selector', () => {
      const mockElement = document.createElement('div');
      mockQuerySelector.mockReturnValue(mockElement);
      // Mock querySelectorAll to return an array with the element
      const mockQuerySelectorAll = jest.fn().mockReturnValue([mockElement]);
      document.querySelectorAll = mockQuerySelectorAll;

      const result = testSelector('div');

      expect(result).toBe(true);
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('div');
    });

    test('should return false for invalid selector', () => {
      mockQuerySelector.mockReturnValue(null);
      // Mock querySelectorAll to return an empty array
      const mockQuerySelectorAll = jest.fn().mockReturnValue([]);
      document.querySelectorAll = mockQuerySelectorAll;

      const result = testSelector('.non-existent');

      expect(result).toBe(false);
    });

    test('should handle selector errors gracefully', () => {
      // Mock querySelectorAll to throw error
      const mockQuerySelectorAll = jest.fn().mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      document.querySelectorAll = mockQuerySelectorAll;

      // Mock console.warn to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = testSelector('**invalid**');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid selector: **invalid**', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getWorkingSelectors', () => {
    test('should return selectors that work', () => {
      // Mock successful selectors
      const mockQuerySelectorAll = jest.fn().mockImplementation((selector) => {
        if (selector === CHATGPT_SELECTORS.message.container) {
          return [document.createElement('div')];
        }
        if (selector === CHATGPT_SELECTORS.message.content) {
          return [document.createElement('div')];
        }
        if (selector === CHATGPT_SELECTORS.actions.container) {
          return [document.createElement('div')];
        }
        if (selector === CHATGPT_SELECTORS.conversation.container) {
          return [document.createElement('div')];
        }
        return [];
      });
      document.querySelectorAll = mockQuerySelectorAll;

      const result = getWorkingSelectors();

      expect(result.message?.container).toBe(CHATGPT_SELECTORS.message.container);
      expect(result.message?.content).toBe(CHATGPT_SELECTORS.message.content);
      expect(result.actions?.container).toBe(CHATGPT_SELECTORS.actions.container);
      expect(result.conversation?.container).toBe(CHATGPT_SELECTORS.conversation.container);
    });

    test('should use fallback selectors when primary ones fail', () => {
      // Mock primary selectors failing but fallbacks working
      const mockQuerySelectorAll = jest.fn().mockImplementation((selector) => {
        if (selector === CHATGPT_SELECTORS.message.container) {
          return [];
        }
        if (selector === CHATGPT_SELECTORS.message.content) {
          return [];
        }
        if (selector.startsWith(FALLBACK_SELECTORS.message[0])) {
          return [document.createElement('div')];
        }
        if (selector.startsWith(FALLBACK_SELECTORS.content[0])) {
          return [document.createElement('div')];
        }
        return [];
      });
      document.querySelectorAll = mockQuerySelectorAll;

      const result = getWorkingSelectors();

      expect(result.message?.container).toBe(FALLBACK_SELECTORS.message[0]);
      expect(result.message?.content).toBe(FALLBACK_SELECTORS.content[0]);
    });
  });

  describe('extractMessageId', () => {
    test('should extract message ID from data attributes', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-message-id', 'test-message-id');

      const result = extractMessageId(mockElement);

      expect(result).toBe('test-message-id');
    });

    test('should extract message ID from data-testid', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'test-turn-1');

      const result = extractMessageId(mockElement);

      expect(result).toBe('test-turn-1');
    });

    test('should extract message ID from id attribute', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'message-123';

      const result = extractMessageId(mockElement);

      expect(result).toBe('message-123');
    });

    test('should extract message ID from class names', () => {
      const mockElement = document.createElement('div');
      mockElement.className = 'message-container turn-1 conversation-item';

      const result = extractMessageId(mockElement);

      expect(result).toBe('message-container');
    });

    test('should return null when no ID found', () => {
      const mockElement = document.createElement('div');
      mockElement.className = 'random-class';

      const result = extractMessageId(mockElement);

      expect(result).toBeNull();
    });
  });

  describe('extractConversationId', () => {
    test('should extract conversation ID from URL', () => {
      // Ensure the URL is properly mocked for this test
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'chatgpt.com',
          pathname: '/c/550e8400-e29b-41d4-a716-446655440000',
          href: 'https://chatgpt.com/c/550e8400-e29b-41d4-a716-446655440000'
        },
        writable: true
      });

      const result = extractConversationId();

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should extract conversation ID from DOM', () => {
      // Mock URL extraction failing
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'chatgpt.com',
          pathname: '/chat',
          href: 'https://chatgpt.com/chat'
        },
        writable: true
      });

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-conversation-id', 'dom-conversation-id');
      mockQuerySelector.mockReturnValue(mockElement);

      const result = extractConversationId();

      expect(result).toBe('dom-conversation-id');
    });

    test('should return null when no conversation ID found', () => {
      // Mock URL extraction failing
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
          pathname: '/chat',
          href: 'https://example.com/chat'
        },
        writable: true
      });

      mockQuerySelector.mockReturnValue(null);

      const result = extractConversationId();

      expect(result).toBeNull();
    });
  });
});