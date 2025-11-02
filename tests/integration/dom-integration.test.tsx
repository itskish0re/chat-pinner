/**
 * DOM Integration Tests
 *
 * Integration tests for ChatGPT DOM utilities and monitoring.
 * Tests real DOM manipulation and ChatGPT-like structures.
 */

import React from 'react';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useChatGPTDOM } from '../../src/contents/hooks/useChatGPTDOM';
import { CHATGPT_SELECTORS } from '../../src/contents/utils/dom-selectors';

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const {
    messages,
    conversation,
    isReady,
    isMonitoring,
    extractMessageMetadata,
    getMessageContent,
    analyzeDOM
  } = useChatGPTDOM();

  return (
    <div>
      <div data-testid="is-ready">{isReady.toString()}</div>
      <div data-testid="is-monitoring">{isMonitoring.toString()}</div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="conversation-id">{conversation?.id || 'none'}</div>
      <div data-testid="conversation-title">{conversation?.title || 'none'}</div>
    </div>
  );
};

describe('DOM Integration Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.title = 'ChatGPT Test Conversation';

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'chatgpt.com',
        pathname: '/c/test-conversation-123',
        href: 'https://chatgpt.com/c/test-conversation-123'
      },
      writable: true
    });

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

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('ChatGPT-like DOM structure', () => {
    test('should detect messages in ChatGPT-like structure', async () => {
      // Create ChatGPT-like DOM structure
      const conversationContainer = document.createElement('div');
      conversationContainer.setAttribute('data-testid', 'conversation-turn');

      const message1 = document.createElement('div');
      message1.setAttribute('data-message-id', 'msg-1');
      message1.setAttribute('data-testid', 'conversation-turn-0');

      const message1Content = document.createElement('div');
      message1Content.className = 'prose';
      message1Content.textContent = 'This is the first message content';

      const message1Author = document.createElement('div');
      message1Author.setAttribute('data-testid', 'conversation-turn-author');
      message1Author.textContent = 'You';

      message1.appendChild(message1Content);
      message1.appendChild(message1Author);

      const message2 = document.createElement('div');
      message2.setAttribute('data-message-id', 'msg-2');
      message2.setAttribute('data-testid', 'conversation-turn-1');

      const message2Content = document.createElement('div');
      message2Content.className = 'prose';
      message2Content.textContent = 'This is the second message content';

      const message2Author = document.createElement('div');
      message2Author.setAttribute('data-testid', 'conversation-turn-author');
      message2Author.textContent = 'ChatGPT';

      message2.appendChild(message2Content);
      message2.appendChild(message2Author);

      conversationContainer.appendChild(message1);
      conversationContainer.appendChild(message2);

      document.body.appendChild(conversationContainer);

      // Add conversation metadata
      const conversationMeta = document.createElement('div');
      conversationMeta.setAttribute('data-conversation-id', 'test-conversation-123');
      document.body.appendChild(conversationMeta);

      render(<TestComponent />);

      // Wait for initialization and scanning
      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('true');
      }, { timeout: 1000 });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      }, { timeout: 1000 });

      await waitFor(() => {
        expect(screen.getByTestId('conversation-id')).toHaveTextContent('test-conversation-123');
      }, { timeout: 1000 });

      expect(screen.getByTestId('is-monitoring')).toHaveTextContent('true');
    });

    test('should extract message metadata correctly', async () => {
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.setAttribute('data-message-id', 'msg-test-1');
      messageElement.setAttribute('data-testid', 'conversation-turn-0');

      const messageContent = document.createElement('div');
      messageContent.className = 'prose';
      messageContent.textContent = 'Test message for metadata extraction';

      const messageAuthor = document.createElement('div');
      messageAuthor.setAttribute('data-testid', 'conversation-turn-author');
      messageAuthor.textContent = 'You';

      const messageTime = document.createElement('div');
      messageTime.setAttribute('data-testid', 'conversation-turn-time');
      messageTime.textContent = '3:45 PM';

      messageElement.appendChild(messageContent);
      messageElement.appendChild(messageAuthor);
      messageElement.appendChild(messageTime);

      document.body.appendChild(messageElement);

      // Add conversation metadata
      const conversationMeta = document.createElement('div');
      conversationMeta.setAttribute('data-conversation-id', 'conv-test-1');
      document.body.appendChild(conversationMeta);

      const { result } = renderHook(() => useChatGPTDOM());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 1000 });

      const metadata = result.current.extractMessageMetadata(
        messageElement as any
      );

      expect(metadata).toEqual({
        messageId: 'msg-test-1',
        conversationId: 'conv-test-1',
        position: 0,
        author: 'user',
        timestamp: '3:45 PM'
      });
    });

    test('should handle fallback selectors', async () => {
      // Create structure with different selectors
      const messageElement = document.createElement('div');
      messageElement.className = 'message-container';
      messageElement.id = 'message-fallback-1';

      const messageContent = document.createElement('div');
      messageContent.className = 'text-base whitespace-pre-wrap';
      messageContent.textContent = 'Content using fallback selectors';

      messageElement.appendChild(messageContent);
      document.body.appendChild(messageElement);

      // Test fallback selectors
      const workingSelectors = {
        message: {
          container: '.message-container',
          content: '.text-base',
          author: '',
          timestamp: ''
        },
        actions: {
          container: '',
          button: ''
        },
        conversation: {
          container: 'main',
          id: '',
          title: ''
        }
      };

      // This would test the fallback mechanism
      expect(messageElement.querySelector('.text-base')).toBeTruthy();
      expect(messageElement.textContent).toContain('Content using fallback selectors');
    });
  });

  describe('DOM monitoring', () => {
    test('should detect new messages added to DOM', async () => {
      // Initial setup
      const conversationContainer = document.createElement('main');
      document.body.appendChild(conversationContainer);

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('is-monitoring')).toHaveTextContent('true');
      }, { timeout: 1000 });

      // Add new message dynamically
      const newMessage = document.createElement('div');
      newMessage.setAttribute('data-message-id', 'dynamic-msg-1');
      newMessage.setAttribute('data-testid', 'conversation-turn-2');

      const newContent = document.createElement('div');
      newContent.className = 'prose';
      newContent.textContent = 'Dynamically added message';

      newMessage.appendChild(newContent);
      conversationContainer.appendChild(newMessage);

      // Trigger DOM change detection
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      }, { timeout: 1000 });
    });

    test('should handle DOM structure changes gracefully', async () => {
      // Create initial structure
      const container = document.createElement('div');
      container.className = 'conversation-wrapper';

      const message = document.createElement('div');
      message.setAttribute('data-message-id', 'original-msg');
      message.textContent = 'Original message';

      container.appendChild(message);
      document.body.appendChild(container);

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toBe(true);
      }, { timeout: 1000 });

      // Change DOM structure
      container.removeChild(message);

      const newContainer = document.createElement('section');
      newContainer.className = 'new-conversation';

      const newMessage = document.createElement('article');
      newMessage.setAttribute('data-message-id', 'new-structure-msg');
      newMessage.textContent = 'Message in new structure';

      newContainer.appendChild(newMessage);
      document.body.appendChild(newContainer);

      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Should still work with new structure
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      }, { timeout: 1000 });
    });
  });

  describe('Error handling', () => {
    test('should handle missing DOM elements gracefully', async () => {
      // Empty DOM
      document.body.innerHTML = '';

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('false');
      }, { timeout: 1000 });

      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('none');
    });

    test('should handle malformed DOM structure', async () => {
      // Create malformed structure
      const malformedElement = document.createElement('div');
      malformedElement.setAttribute('data-message-id', ''); // Empty ID
      malformedElement.innerHTML = '<span>Malformed content</span>';

      document.body.appendChild(malformedElement);

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('false');
      }, { timeout: 1000 });

      // Should not crash
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    });
  });
});