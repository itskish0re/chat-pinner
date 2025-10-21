# Testing Requirements

For ChatPinner's 1-week MVP timeline, I'm implementing a focused testing strategy that prioritizes core functionality while maintaining development velocity. The approach combines unit testing for critical business logic with integration testing for ChatGPT DOM interaction.

### Component Test Template

```typescript
/**
 * PinButton.test.tsx
 *
 * Unit tests for the PinButton component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { PinButton } from '../PinButton';
import { ChatGPTTheme } from '../../styles/chatgpt-theme';
import { PinProvider } from '../../context/PinContext';

// Mock Chrome storage API
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      getBytesInUse: jest.fn().mockResolvedValue(1000),
      QUOTA_BYTES: 5242880, // 5MB
    }
  }
};

// Mock DOM elements
const mockMessageElement = {
  getAttribute: jest.fn((attr) => {
    switch (attr) {
      case 'data-message-id': return 'test-message-123';
      case 'data-conversation-id': return 'test-conversation-456';
      default: return null;
    }
  }),
  querySelector: jest.fn((selector) => {
    if (selector === '[data-message-content]') {
      return {
        textContent: 'This is a test message content for pinning.'
      };
    }
    return null;
  }),
  closest: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  }
} as any;

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={ChatGPTTheme}>
    <PinProvider>
      {children}
    </PinProvider>
  </ThemeProvider>
);

describe('PinButton', () => {
  const user = userEvent.setup();
  const defaultProps = {
    messageElement: mockMessageElement,
    conversationId: 'test-conversation-456',
    'aria-label': 'Pin message'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).chrome = mockChrome;
  });

  test('renders pin button with correct attributes', () => {
    render(
      <TestWrapper>
        <PinButton {...defaultProps} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: 'Pin message' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toBeEnabled();
  });

  test('shows pinned state when message is already pinned', () => {
    const mockUsePinStorage = require('../../hooks/usePinStorage').usePinStorage;
    mockUsePinStorage.mockReturnValue({
      createPin: jest.fn(),
      removePin: jest.fn(),
      isPinned: jest.fn(() => true),
    });

    render(
      <TestWrapper>
        <PinButton {...defaultProps} />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('title', 'Remove pin');
  });

  test('calls createPin when clicked on unpinned message', async () => {
    const mockCreatePin = jest.fn().mockResolvedValue(undefined);
    const mockUsePinStorage = require('../../hooks/usePinStorage').usePinStorage;
    mockUsePinStorage.mockReturnValue({
      createPin: mockCreatePin,
      removePin: jest.fn(),
      isPinned: jest.fn(() => false),
    });

    render(
      <TestWrapper>
        <PinButton {...defaultProps} />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockCreatePin).toHaveBeenCalledWith({
        messageId: 'test-message-123',
        conversationId: 'test-conversation-456',
        content: 'This is a test message content for pinning.',
        position: 0
      });
    });
  });

  test('is accessible via keyboard navigation', async () => {
    render(
      <TestWrapper>
        <PinButton {...defaultProps} />
      </TestWrapper>
    );

    const button = screen.getByRole('button');

    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Activate with Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });

    // Should trigger pin creation
    await waitFor(() => {
      const mockUsePinStorage = require('../../hooks/usePinStorage').usePinStorage();
      expect(mockUsePinStorage.createPin).toHaveBeenCalled();
    });
  });
});
```

### Testing Best Practices

**Unit Testing Strategy:**
1. **Component Isolation**: Test components in isolation with mocked dependencies
2. **User Interactions**: Test all user interactions (click, hover, keyboard navigation)
3. **State Management**: Verify proper state updates and error handling
4. **Accessibility**: Test ARIA attributes, keyboard navigation, and screen reader compatibility
5. **Performance**: Test component rendering and interaction performance

**Integration Testing Strategy:**
1. **DOM Integration**: Test actual ChatGPT DOM manipulation and interaction
2. **Storage Operations**: Verify chrome.storage.local integration and error handling
3. **Navigation Workflow**: Test complete pin creation → storage → navigation workflow
4. **Error Scenarios**: Test error handling for storage limits, missing elements, etc.
5. **Browser Compatibility**: Test cross-browser functionality where possible

**Coverage Goals for MVP:**
- **Unit Tests**: 80% coverage for business logic
- **Integration Tests**: Core workflows covered
- **Manual Testing**: Cross-browser compatibility verification

---
