# Frontend Developer Standards

For ChatPinner's 1-week MVP development timeline, I'm establishing clear coding standards that prevent common AI mistakes while enabling rapid development and maintainability for future multi-platform expansion.

### Critical Coding Rules

#### **Universal Rules (Apply to All Extensions)**
1. **Never Block ChatGPT Loading**: All initialization must be asynchronous and non-blocking
2. **CSS Scope Isolation**: Never use global CSS classes - always use styled-components or CSS-in-JS
3. **ChatGPT DOM Integrity**: Never modify ChatGPT's core DOM structure - only add elements
4. **Storage Error Handling**: Always handle chrome.storage.local quota exceeded errors
5. **Performance Budget**: Extension initialization must complete within 100ms
6. **Memory Management**: Always clean up observers, listeners, and intervals in cleanup functions
7. **Security First**: Never inject external scripts or evaluate user input as code
8. **Accessibility Compliance**: All interactive elements must be keyboard navigable

#### **React + Plasmo Specific Rules**
9. **Component Props Interface**: Every component must have TypeScript interface with JSDoc comments
10. **Custom Hook Rules**: Custom hooks must start with 'use' and handle cleanup properly
11. **State Management**: Never mutate state directly - always use immutable updates
12. **Error Boundaries**: Wrap major components in error boundaries to prevent extension crashes
13. **Prop Drilling Prevention**: Use Context API for shared state, avoid deep prop passing
14. **Styled Components**: Always use ChatGPT theme variables, never hardcode colors

#### **ChatGPT Integration Specific Rules**
15. **DOM Mutation Observer**: Always debounce DOM observations to prevent performance issues
16. **Message ID Reliability**: Never assume message IDs are permanent - always validate existence
17. **CSS Class Safety**: Never use ChatGPT's internal CSS classes - they can change without notice
18. **Selector Specificity**: Use attribute selectors over class selectors for ChatGPT elements
19. **Responsive Design**: Always test with different ChatGPT layout configurations
20. **UI Timing**: Wait for ChatGPT interface to be fully loaded before injecting components

### Quick Reference

#### **Development Commands**
```bash
# Development
npm run dev                    # Start development server
npm run dev:mock              # Development with ChatGPT mocking
npm run test                  # Run unit tests
npm run test:integration      # Run integration tests
npm run lint                  # Code linting
npm run type-check            # TypeScript validation

# Building
npm run build                 # Production build
npm run build:chrome          # Chrome-specific build
npm run build:firefox         # Firefox-specific build
npm run build:all             # All platforms build

# Package for distribution
npm run package               # Build and compress for stores
```

#### **Key Import Patterns**
```typescript
// React and libraries
import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';

// Internal types
import { PinData, MessageElement } from '@/types/extension.types';

// Internal hooks and utilities
import { usePinStorage } from '@/hooks/usePinStorage';
import { ChatGPTTheme } from '@/styles/chatgpt-theme';
import { chatGPTIntegration } from '@/services/api/chatgpt-integration';
```

#### **File Naming Conventions**
```
Components/           PinButton.tsx, PinHeader.tsx, PinItem.tsx
Hooks/                usePinStorage.ts, useChatGPTDOM.ts, useNavigation.ts
Utils/                storage-manager.ts, dom-selectors.ts, performance.ts
Types/                extension.types.ts, pin.types.ts, storage.types.ts
Styles/               chatgpt-theme.ts, pin-button.styles.ts
Services/             chatgpt-integration.ts, extension-navigation.ts
Tests/                PinButton.test.tsx, pin-workflow.integration.test.tsx
```

#### **Project-Specific Patterns**

**Component Pattern:**
```typescript
/**
 * File: src/contents/components/PinButton.tsx
 *
 * Pin button for ChatGPT messages with proper styling and accessibility.
 * Uses ChatGPT theme variables and handles loading/error states.
 */
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { ChatGPTTheme } from '../../styles/chatgpt-theme';
import { usePinStorage } from '../../hooks/usePinStorage';

// Styled component using theme variables
const ButtonContainer = styled.button<{ $isPinned: boolean }>`
  /* Use ChatGPT theme variables only */
  color: ${props => props.$isPinned
    ? ChatGPTTheme.colors.brand.purple
    : ChatGPTTheme.colors.icon.secondary
  };
  background-color: transparent;
  /* ... */
`;

interface PinButtonProps {
  /** ChatGPT message element to pin */
  messageElement: MessageElement;
  /** Conversation identifier */
  conversationId: string;
  /** Optional callback */
  onPinChange?: (isPinned: boolean) => void;
}

export const PinButton: React.FC<PinButtonProps> = ({
  messageElement,
  conversationId,
  onPinChange
}) => {
  // Component implementation
};
```

**Hook Pattern:**
```typescript
/**
 * File: src/contents/hooks/usePinStorage.ts
 *
 * Hook for chrome.storage.local operations with error handling.
 * Includes quota management and data validation.
 */
import { useState, useCallback } from 'react';
import { PinData } from '../types/pin.types';

export const usePinStorage = () => {
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  // Always handle cleanup and errors
  const createPin = useCallback(async (pinData: Omit<PinData, 'id' | 'createdAt'>) => {
    try {
      // Validate data before storage
      if (!pinData.messageId || !pinData.conversationId) {
        throw new Error('Invalid pin data');
      }

      // Check storage quota
      const quota = await checkStorageQuota();
      if (quota.isNearLimit) {
        throw new Error('Storage quota exceeded');
      }

      // Perform storage operation
      await chrome.storage.local.set({ [STORAGE_KEY]: updatedPins });
    } catch (error) {
      // Always handle errors gracefully
      console.error('Failed to create pin:', error);
      throw error;
    }
  }, []);

  return { createPin, /* ... */ };
};
```

**Critical Success Factors for 1-Week MVP:**

1. **Code Quality**: TypeScript strict mode with comprehensive type checking
2. **Testing**: 80% code coverage for critical business logic
3. **Performance**: Sub-100ms extension initialization time
4. **Security**: No external API calls or eval() usage
5. **Accessibility**: WCAG 2.1 AA compliance for all interactive elements
6. **Maintainability**: Clear separation of concerns and modular architecture

**Development Workflow:**
1. **Feature Development**: Component → Hook → Test → Integration
2. **Code Review**: Focus on security, performance, and accessibility
3. **Testing**: Unit tests for logic, integration tests for workflows
4. **Deployment**: Automated builds for Chrome and Firefox stores

---
