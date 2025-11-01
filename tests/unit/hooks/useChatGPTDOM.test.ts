/**
 * useChatGPTDOM Hook Tests
 *
 * Unit tests for the ChatGPT DOM analysis and monitoring hook.
 * Tests message detection, DOM monitoring, and utility functions.
 */

import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      getBytesInUse: jest.fn().mockResolvedValue(1000),
      QUOTA_BYTES: 5242880
    }
  }
} as any;

// Mock DOM environment
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'chatgpt.com',
    pathname: '/c/test-conversation-id',
    href: 'https://chatgpt.com/c/test-conversation-id'
  },
  writable: true
});

// Mock DOM querySelector
const mockQuerySelector = jest.fn();
document.querySelector = mockQuerySelector;
document.querySelectorAll = mockQuerySelector;
Object.defineProperty(document, 'title', {
  value: 'Test ChatGPT Conversation',
  writable: true
});

// Import the hook after mocks are set up
import { useChatGPTDOM } from '../../../src/contents/hooks/useChatGPTDOM';
import { MessageElement } from '../../../src/types/chatgpt.types';

describe('useChatGPTDOM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    test('should initialize with empty state', () => {
      // Mock successful DOM analysis
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelector.mockReturnValue([]);

      const { result } = renderHook(() => useChatGPTDOM());

      expect(result.current.messages).toEqual([]);
      expect(result.current.conversation).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.isMonitoring).toBe(false);
    });

    test('should detect conversation and messages on successful analysis', () => {
      // Mock message elements
      const mockMessageElements = [
        {
          getAttribute: jest.fn((attr) => {
            if (attr === 'data-message-id') return 'msg-1';
            return null;
          }),
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(() => []),
          textContent: 'Test message 1'
        },
        {
          getAttribute: jest.fn((attr) => {
            if (attr === 'data-message-id') return 'msg-2';
            return null;
          }),
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(() => []),
          textContent: 'Test message 2'
        }
      ] as MessageElement[];

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === '[data-message-id="msg-1"], [data-testid="msg-1"]') {
          return mockMessageElements[0];
        }
        if (selector === '[data-message-id="msg-2"], [data-testid="msg-2"]') {
          return mockMessageElements[1];
        }
        if (selector === '[data-conversation-id]') {
          return { getAttribute: () => 'test-conversation-id' };
        }
        if (selector.includes('conversation-turn')) {
          return mockMessageElements;
        }
        return null;
      });

      const { result } = renderHook(() => useChatGPTDOM());

      act(() => {
        jest.advanceTimersByTime(150); // More than debounce delay
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.conversation).toEqual({
        id: 'test-conversation-id',
        url: 'https://chatgpt.com/c/test-conversation-id',
        title: 'Test ChatGPT Conversation'
      });
    });
  });

  describe('extractMessageMetadata', () => {
    test('should extract metadata from message element', () => {
      const mockMessageElement = {
        getAttribute: jest.fn((attr) => {
          if (attr === 'data-message-id') return 'test-message-id';
          return null;
        }),
        querySelector: jest.fn((selector) => {
          if (selector.includes('author')) {
            return { textContent: 'You' };
          }
          if (selector.includes('time')) {
            return { textContent: '2:30 PM' };
          }
          return null;
        }),
        textContent: 'Test message content'
      } as MessageElement;

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === '[data-conversation-id]') {
          return { getAttribute: () => 'test-conversation-id' };
        }
        if (selector.includes('conversation-turn')) {
          return [mockMessageElement];
        }
        return null;
      });

      const { result } = renderHook(() => useChatGPTDOM());

      act(() => {
        jest.advanceTimersByTime(150);
      });

      const metadata = result.current.extractMessageMetadata(mockMessageElement);

      expect(metadata).toEqual({
        messageId: 'test-message-id',
        conversationId: 'test-conversation-id',
        position: 0,
        author: 'user',
        timestamp: '2:30 PM'
      });
    });

    test('should return null for invalid message element', () => {
      const mockMessageElement = {
        getAttribute: jest.fn(() => null),
        querySelector: jest.fn(),
        textContent: 'Test content'
      } as MessageElement;

      mockQuerySelector.mockReturnValue(null);

      const { result } = renderHook(() => useChatGPTDOM());

      const metadata = result.current.extractMessageMetadata(mockMessageElement);

      expect(metadata).toBeNull();
    });
  });

  describe('getMessageContent', () => {
    test('should extract content from message element', () => {
      const mockContentElement = {
        textContent: 'This is the message content'
      };

      const mockMessageElement = {
        querySelector: jest.fn(() => mockContentElement)
      } as MessageElement;

      mockQuerySelector.mockReturnValue([mockMessageElement]);

      const { result } = renderHook(() => useChatGPTDOM());

      const content = result.current.getMessageContent(mockMessageElement);

      expect(content).toBe('This is the message content');
    });

    test('should fallback to element text content', () => {
      const mockMessageElement = {
        querySelector: jest.fn(() => null),
        textContent: 'Fallback content'
      } as MessageElement;

      mockQuerySelector.mockReturnValue([mockMessageElement]);

      const { result } = renderHook(() => useChatGPTDOM());

      const content = result.current.getMessageContent(mockMessageElement);

      expect(content).toBe('Fallback content');
    });
  });

  describe('findMessageById', () => {
    test('should find message by ID in cache', () => {
      const mockMessageElement = {
        getAttribute: jest.fn(() => 'test-message-id'),
        querySelector: jest.fn()
      } as MessageElement;

      mockQuerySelector.mockReturnValue([mockMessageElement]);

      const { result } = renderHook(() => useChatGPTDOM());

      act(() => {
        jest.advanceTimersByTime(150);
      });

      const foundMessage = result.current.findMessageById('test-message-id');

      expect(foundMessage).toBe(mockMessageElement);
    });

    test('should return null for non-existent message', () => {
      mockQuerySelector.mockReturnValue([]);

      const { result } = renderHook(() => useChatGPTDOM());

      const foundMessage = result.current.findMessageById('non-existent-id');

      expect(foundMessage).toBeNull();
    });
  });

  describe('DOM monitoring', () => {
    test('should start and stop monitoring', () => {
      mockQuerySelector.mockReturnValue([]);

      const { result } = renderHook(() => useChatGPTDOM());

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    test('should detect new messages via MutationObserver', () => {
      const mockMessageElement = {
        getAttribute: jest.fn(() => 'new-message-id'),
        querySelector: jest.fn(),
        textContent: 'New message'
      } as MessageElement;

      let mutationCallback: ((mutations: MutationRecord[]) => void) | null = null;

      // Mock MutationObserver
      global.MutationObserver = jest.fn().mockImplementation((callback) => {
        mutationCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn()
        };
      }) as any;

      mockQuerySelector.mockReturnValue([]);

      const { result } = renderHook(() => useChatGPTDOM());

      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Simulate DOM mutation
      if (mutationCallback) {
        const mockMutation = {
          type: 'childList',
          addedNodes: [document.createElement('div')]
        } as MutationRecord;

        act(() => {
          mutationCallback([mockMutation]);
          jest.advanceTimersByTime(150);
        });
      }

      expect(result.current.isMonitoring).toBe(true);
    });
  });

  describe('analyzeDOM', () => {
    test('should return successful analysis result', () => {
      const mockMessageElement = {
        getAttribute: jest.fn(() => 'test-message-id'),
        querySelector: jest.fn(),
        textContent: 'Test message'
      } as MessageElement;

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === '[data-conversation-id]') {
          return { getAttribute: () => 'test-conversation-id' };
        }
        if (selector.includes('conversation-turn')) {
          return [mockMessageElement];
        }
        return null;
      });

      const { result } = renderHook(() => useChatGPTDOM());

      const analysis = result.current.analyzeDOM();

      expect(analysis.success).toBe(true);
      expect(analysis.messages).toHaveLength(1);
      expect(analysis.conversation?.id).toBe('test-conversation-id');
      expect(analysis.errors).toHaveLength(0);
    });

    test('should return analysis with errors when DOM is invalid', () => {
      mockQuerySelector.mockReturnValue(null);

      const { result } = renderHook(() => useChatGPTDOM());

      const analysis = result.current.analyzeDOM();

      expect(analysis.success).toBe(false);
      expect(analysis.messages).toHaveLength(0);
      expect(analysis.errors.length).toBeGreaterThan(0);
    });
  });
});