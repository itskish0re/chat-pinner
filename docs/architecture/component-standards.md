# Component Standards

Based on React + Plasmo architecture and ChatGPT integration requirements, here are the component standards for ChatPinner:

### Component Template

```typescript
/**
 * PinButton Component
 *
 * A button added to ChatGPT message action menus that allows users to pin/unpin messages.
 * Integrates seamlessly with ChatGPT's existing UI patterns using CSS-in-JS styling.
 */
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { PinData, MessageElement } from '../types/extension.types';
import { usePinStorage } from '../hooks/usePinStorage';
import { ChatGPTTheme } from '../styles/chatgpt-theme';

// Styled component using ChatGPT theme variables
const PinButtonContainer = styled.button<{ $isPinned: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: calc(var(--spacing) * 1); /* 4px */
  border-radius: 8px;
  background-color: transparent;
  color: ${props => props.$isPinned
    ? ChatGPTTheme.colors.brandPurple
    : ChatGPTTheme.colors.iconSecondary
  };
  border: none;
  cursor: pointer;
  transition: background-color 0.1s linear;

  &:hover {
    background-color: ${ChatGPTTheme.colors.surfaceSecondary};
  }

  &:focus-visible {
    outline: 2px solid ${ChatGPTTheme.colors.brandPurple};
    outline-offset: 2px;
  }

  /* ChatGPT icon styling */
  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

interface PinButtonProps {
  /** ChatGPT message element to pin */
  messageElement: MessageElement;
  /** Conversation identifier for pin organization */
  conversationId: string;
  /** Optional callback for pin state changes */
  onPinChange?: (isPinned: boolean) => void;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

export const PinButton: React.FC<PinButtonProps> = ({
  messageElement,
  conversationId,
  onPinChange,
  'aria-label': ariaLabel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { createPin, removePin, isPinned } = usePinStorage();

  // Check if message is already pinned
  const messageId = messageElement.getAttribute('data-message-id') || '';
  const currentlyPinned = isPinned(messageId, conversationId);

  const handlePinToggle = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (currentlyPinned) {
        await removePin(messageId, conversationId);
        onPinChange?.(false);
      } else {
        const pinData: Omit<PinData, 'id' | 'createdAt'> = {
          messageId,
          conversationId,
          content: extractMessageContent(messageElement),
          position: getMessagePosition(messageElement)
        };

        await createPin(pinData);
        onPinChange?.(true);
      }
    } catch (error) {
      console.error('Pin operation failed:', error);
      // TODO: Show user-friendly error message
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, currentlyPinned, messageId, conversationId, createPin, removePin, onPinChange]);

  return (
    <PinButtonContainer
      $isPinned={currentlyPinned}
      onClick={handlePinToggle}
      disabled={isProcessing}
      aria-label={ariaLabel || (currentlyPinned ? 'Unpin message' : 'Pin message')}
      aria-pressed={currentlyPinned}
      title={currentlyPinned ? 'Remove pin' : 'Pin this message'}
    >
      {isProcessing ? (
        <LoadingIcon />
      ) : currentlyPinned ? (
        <PinFilledIcon />
      ) : (
        <PinOutlineIcon />
      )}
    </PinButtonContainer>
  );
};

// Helper functions (would be extracted to utilities in production)
function extractMessageContent(element: MessageElement): string {
  const contentElement = element.querySelector('[data-message-content]');
  return contentElement?.textContent?.slice(0, 200) || '';
}

function getMessagePosition(element: MessageElement): number {
  const allMessages = document.querySelectorAll('[data-message-id]');
  return Array.from(allMessages).indexOf(element);
}

// Icon components (simplified)
function PinOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function PinFilledIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  );
}
```

### Naming Conventions

**Component Files:**
- **PascalCase**: `PinButton.tsx`, `PinHeader.tsx`, `PinItem.tsx`
- **Descriptive Names**: Component names clearly describe their purpose
- **Index Files**: Use `index.ts` for barrel exports in larger directories

**Hook Files:**
- **camelCase with `use` prefix**: `usePinStorage.ts`, `useChatGPTDOM.ts`, `useSmoothScroll.ts`
- **Function-based**: `useChatGPTDOM.ts` rather than `useChatGPT.ts` for clarity

**Utility Files:**
- **camelCase**: `storage-manager.ts`, `dom-selectors.ts`, `conversation-id.ts`
- **Descriptive Suffixes**: `-manager`, `-selectors`, `-utils` for clarity

**Style Files:**
- **kebab-case**: `pin-button.styles.ts`, `pin-header.styles.ts`
- **Component Correspondence**: Style files match component names

**Type Files:**
- **kebab-case with `.types` suffix**: `extension.types.ts`, `pin.types.ts`, `storage.types.ts`
- **Domain Organization**: Separate files by feature domain

---
