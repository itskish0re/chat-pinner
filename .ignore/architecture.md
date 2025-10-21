# ChatPinner Frontend Architecture Document

## Overview

This document defines the frontend architecture for ChatPinner, a browser extension that enables ChatGPT users to pin specific messages within conversations for quick navigation and reference. The architecture is designed for a 1-week MVP development timeline using React + Plasmo framework.

## Table of Contents

1. [Template and Framework Selection](#template-and-framework-selection)
2. [Frontend Tech Stack](#frontend-tech-stack)
3. [Project Structure](#project-structure)
4. [Component Standards](#component-standards)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing](#routing)
8. [Styling Guidelines](#styling-guidelines)
9. [Testing Requirements](#testing-requirements)
10. [Environment Configuration](#environment-configuration)
11. [Frontend Developer Standards](#frontend-developer-standards)

---

## Template and Framework Selection

### Current Context Analysis

**Project:** ChatPinner - ChatGPT message pinning and productivity tool
**Framework Choice:** Plasmo + React (confirmed)
**No Frontend Starter:** Building from scratch (not using pre-built extension template)
**Target Platforms:** Chrome Web Store, Firefox Add-ons, Edge Add-ons

### Template Selection Confirmation

Since you're using **Plasmo framework** without an existing starter template, the frontend architecture is designed around Plasmo's React extension patterns and best practices.

### Key Architecture Considerations

- **Target:** ChatGPT DOM integration via content script injection
- **Storage:** chrome.storage.local API (not localStorage as specified in PRD corrections)
- **Performance:** <100ms load time, <500ms navigation
- **Styling:** CSS-in-JS to prevent conflicts with ChatGPT's Tailwind v4
- **Browsers:** Chrome 90+, Firefox 88+, Edge 90+
- **Timeline:** 1-week MVP with single developer

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-21 | v1.0 | Initial architecture creation | Winston (Architect) |

---

## Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | React | 18.2+ | UI components and state management | Matches developer skills, Plasmo integration, component-based architecture for 1-week timeline |
| UI Library | CSS-in-JS (styled-components) | 6.0+ | Scoped styling without Tailwind conflicts | Prevents CSS conflicts with ChatGPT's Tailwind v4, React integration, dynamic styling |
| State Management | React Context + useReducer | 18.2+ | Pin data and UI state management | Built-in React solution, no additional dependencies, sufficient for MVP scope |
| Routing | None needed | - | Single-page extension | Content script operates within ChatGPT, no traditional routing required |
| Build Tool | Plasmo Build System | Latest | Extension bundling and compilation | Plasmo's built-in webpack configuration handles extension requirements automatically |
| Styling | styled-components + CSS Variables | Latest | Theme integration with ChatGPT | CSS Variables for ChatGPT theme compatibility, styled-components for component isolation |
| Testing | Jest + React Testing Library | Latest | Unit testing for core logic | Jest for business logic, RTL for component behavior, focused MVP testing approach |
| Component Library | Custom React Components | - | Extension-specific UI elements | Custom components matching ChatGPT's design patterns, no external library needed |
| Form Handling | React hooks (useState, useEffect) | 18.2+ | Pin management interactions | Built-in React hooks sufficient for simple pin editing forms |
| Animation | CSS Transitions + Web Animations API | Latest | Micro-interactions and feedback | Native browser performance, ChatGPT's existing animation patterns |
| Dev Tools | Chrome DevTools + Plasmo CLI | Latest | Development and debugging | Native browser tools for content script debugging, Plasmo CLI for extension workflow |

### Detailed Technology Analysis

**Core Framework Stack:**
- **React 18.2+**: Chosen for intermediate React skills and Plasmo's native React support
- **Plasmo Framework**: Specifically designed for browser extension development with React integration
- **No Traditional Routing**: Since this is a content script extension, we operate within ChatGPT's single-page context

**Styling Strategy:**
- **styled-components**: Provides CSS-in-JS solution that scopes styles to prevent conflicts with ChatGPT's existing Tailwind v4 classes
- **CSS Variables**: Leverages ChatGPT's existing design tokens from UI spec (colors, spacing, typography)
- **Component Isolation**: Each React component maintains its own style scope

**State Management Approach:**
- **React Context + useReducer**: Built-in React solution that avoids additional dependencies
- **chrome.storage.local**: Browser extension storage API for persistent pin data (as corrected in PRD)
- **Component-level State**: For UI interactions and temporary states

---

## Project Structure

Based on Plasmo framework conventions and ChatGPT extension requirements, here's the optimal directory structure for ChatPinner:

```
chat-pinner/
├── manifest.json                 # Auto-generated by Plasmo
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .gitignore                  # Git ignore patterns
├── .eslintrc.js                # ESLint configuration
├──
├── src/                        # Main source directory
│   ├── contents/               # Content scripts for ChatGPT integration
│   │   ├── chatgpt-integration.tsx    # Main content script
│   │   ├── components/              # React components injected into ChatGPT
│   │   │   ├── PinButton.tsx        # Pin button for message actions
│   │   │   ├── PinHeader.tsx        # Sticky pin display header
│   │   │   ├── PinItem.tsx          # Individual pin item component
│   │   │   └── EmptyState.tsx       # Empty state component
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useChatGPTDOM.ts     # DOM analysis utilities
│   │   │   ├── usePinStorage.ts     # Storage operations
│   │   │   └── useSmoothScroll.ts   # Navigation utilities
│   │   ├── utils/                   # Utility functions
│   │   │   ├── dom-selectors.ts     # ChatGPT DOM selectors
│   │   │   ├── storage-manager.ts   # chrome.storage.local wrapper
│   │   │   └── conversation-id.ts   # Conversation identification
│   │   └── styles/                  # Styled-components definitions
│   │       ├── pin-button.styles.ts # Pin button styling
│   │       ├── pin-header.styles.ts # Header component styling
│   │       └── chatgpt-theme.ts     # ChatGPT theme variables
│   │
│   ├── background/               # Background scripts (if needed)
│   │   └── index.ts              # Background service worker
│   │
│   ├── options/                 # Extension options page (future)
│   │   └── index.tsx            # Options UI component
│   │
│   ├── popup/                   # Extension popup (future)
│   │   └── index.tsx            # Popup UI component
│   │
│   ├── assets/                  # Static assets
│   │   ├── icons/               # Extension icons
│   │   │   ├── icon16.png
│   │   │   ├── icon48.png
│   │   │   └── icon128.png
│   │   └── images/              # Other images
│   │
│   └── types/                   # TypeScript type definitions
│       ├── chatgpt.types.ts     # ChatGPT DOM types
│       ├── pin.types.ts         # Pin data structures
│       ├── storage.types.ts     # Storage API types
│       └── extension.types.ts   # Extension-specific types
│
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   │   ├── utils/              # Utility function tests
│   │   │   ├── storage-manager.test.ts
│   │   │   └── conversation-id.test.ts
│   │   └── hooks/              # Hook tests
│   │       ├── usePinStorage.test.ts
│   │       └── useChatGPTDOM.test.ts
│   │
│   ├── integration/            # Integration tests
│   │   ├── pin-workflow.test.tsx
│   │   └── navigation.test.tsx
│   │
│   └── __mocks__/              # Mock files for testing
│       └── chrome.ts           # Chrome API mocks
│
├── docs/                       # Documentation (already exists)
│   ├── prd.md
│   ├── brief.md
│   ├── front-end-spec.md
│   └── architecture.md         # This file
│
└── dist/                       # Build output (auto-generated)
    └── ...                     # Plasmo build artifacts
```

### Key Architecture Decisions

**Content Script Structure (`src/contents/`):**
- **Main Integration Point**: `chatgpt-integration.tsx` serves as the entry point for injecting React components into ChatGPT
- **Component Isolation**: All UI components live in `components/` to maintain clear separation and enable easy testing
- **Custom Hooks**: Business logic extracted into reusable hooks for better maintainability
- **DOM Utilities**: ChatGPT-specific DOM analysis separated into utility functions

**Styling Strategy (`src/contents/styles/`):**
- **Component-scoped Styles**: Each major component has its own styled-components file
- **Theme Integration**: `chatgpt-theme.ts` centralizes all ChatGPT design variables from UI spec
- **CSS Variable Mapping**: Direct mapping to ChatGPT's existing CSS custom properties

**Type Safety (`src/types/`):**
- **Comprehensive Typing**: Separate type files for different domains (ChatGPT DOM, storage, extension)
- **Interface Clarity**: Clear contracts between components and utility functions
- **Future Extensibility**: Types designed to accommodate multi-platform expansion

---

## Component Standards

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

## State Management

For ChatPinner's browser extension architecture, I'm using React's built-in state management with Context API and chrome.storage.local for persistence. This approach minimizes dependencies while providing sufficient capabilities for the MVP scope.

### Store Structure

```
src/contents/
├── context/
│   ├── PinContext.tsx          # Main pin state management context
│   ├── UIContext.tsx           # UI state (header collapsed, loading states)
│   └── ChatGPTContext.tsx      # ChatGPT DOM state and conversation info
│
├── hooks/
│   ├── usePinStorage.ts        # Hook for chrome.storage.local operations
│   ├── usePins.ts              # Hook for pin state operations
│   ├── useUIState.ts           # Hook for UI state management
│   └── useChatGPTDOM.ts        # Hook for ChatGPT DOM monitoring
│
└── utils/
    └── storage-manager.ts      # Chrome storage API wrapper
```

### State Management Template

```typescript
/**
 * PinContext.tsx
 *
 * Central state management for pin operations using React Context API.
 * Handles pin creation, retrieval, deletion, and conversation management.
 */
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { PinData, PinState, PinAction } from '../types/pin.types';
import { usePinStorage } from '../hooks/usePinStorage';
import { generateId } from '../utils/helpers';

// Initial state
const initialState: PinState = {
  pins: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
  pinsByConversation: new Map(),
};

// Reducer for pin state management
function pinReducer(state: PinState, action: PinAction): PinState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_CONVERSATION':
      return {
        ...state,
        currentConversationId: action.payload,
        pins: state.pinsByConversation.get(action.payload) || []
      };

    case 'LOAD_PINS':
      const pinsByConversation = new Map<string, PinData[]>();

      // Group pins by conversation
      action.payload.forEach((pin: PinData) => {
        const conversationPins = pinsByConversation.get(pin.conversationId) || [];
        conversationPins.push(pin);
        pinsByConversation.set(pin.conversationId, conversationPins);
      });

      // Sort pins within each conversation by creation time
      pinsByConversation.forEach(pins => {
        pins.sort((a, b) => a.createdAt - b.createdAt);
      });

      const currentPins = state.currentConversationId
        ? pinsByConversation.get(state.currentConversationId) || []
        : [];

      return {
        ...state,
        pins: currentPins,
        pinsByConversation,
        isLoading: false,
        error: null
      };

    case 'ADD_PIN':
      const newPin: PinData = {
        ...action.payload,
        id: generateId(),
        createdAt: Date.now(),
      };

      const updatedPins = [...state.pins, newPin];
      const updatedConversationPins = [
        ...(state.pinsByConversation.get(newPin.conversationId) || []),
        newPin
      ].sort((a, b) => a.createdAt - b.createdAt);

      const updatedMap = new Map(state.pinsByConversation);
      updatedMap.set(newPin.conversationId, updatedConversationPins);

      return {
        ...state,
        pins: updatedPins,
        pinsByConversation: updatedMap,
        error: null
      };

    case 'REMOVE_PIN':
      const filteredPins = state.pins.filter(pin => pin.id !== action.payload);
      const filteredMap = new Map<string, PinData[]>();

      state.pinsByConversation.forEach((conversationPins, conversationId) => {
        const filtered = conversationPins.filter(pin => pin.id !== action.payload);
        if (filtered.length > 0) {
          filteredMap.set(conversationId, filtered);
        }
      });

      return {
        ...state,
        pins: filteredPins,
        pinsByConversation: filteredMap,
        error: null
      };

    default:
      return state;
  }
}

// Context type definition
interface PinContextType {
  state: PinState;
  actions: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setCurrentConversation: (conversationId: string | null) => void;
    createPin: (pinData: Omit<PinData, 'id' | 'createdAt'>) => Promise<void>;
    removePin: (pinId: string) => Promise<void>;
    refreshPins: () => Promise<void>;
    isPinned: (messageId: string, conversationId: string) => boolean;
    getPinCount: (conversationId?: string) => number;
  };
}

// Create context
const PinContext = createContext<PinContextType | undefined>(undefined);

// Provider component
export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pinReducer, initialState);
  const storage = usePinStorage();

  // Load pins from storage on mount
  useEffect(() => {
    refreshPins();
  }, []);

  // Actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setCurrentConversation = useCallback((conversationId: string | null) => {
    dispatch({ type: 'SET_CONVERSATION', payload: conversationId });
  }, []);

  const createPin = useCallback(async (pinData: Omit<PinData, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      await storage.createPin(pinData);
      dispatch({ type: 'ADD_PIN', payload: pinData });
    } catch (error) {
      setError(`Failed to create pin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [storage, setLoading, setError]);

  const removePin = useCallback(async (pinId: string) => {
    try {
      setLoading(true);
      await storage.removePin(pinId);
      dispatch({ type: 'REMOVE_PIN', payload: pinId });
    } catch (error) {
      setError(`Failed to remove pin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [storage, setLoading, setError]);

  const refreshPins = useCallback(async () => {
    try {
      setLoading(true);
      const pins = await storage.getAllPins();
      dispatch({ type: 'LOAD_PINS', payload: pins });
    } catch (error) {
      setError(`Failed to load pins: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [storage, setLoading, setError]);

  const isPinned = useCallback((messageId: string, conversationId: string): boolean => {
    const conversationPins = state.pinsByConversation.get(conversationId) || [];
    return conversationPins.some(pin => pin.messageId === messageId);
  }, [state.pinsByConversation]);

  const getPinCount = useCallback((conversationId?: string): number => {
    if (conversationId) {
      return state.pinsByConversation.get(conversationId)?.length || 0;
    }
    return Array.from(state.pinsByConversation.values()).reduce((total, pins) => total + pins.length, 0);
  }, [state.pinsByConversation]);

  const value: PinContextType = {
    state,
    actions: {
      setLoading,
      setError,
      setCurrentConversation,
      createPin,
      removePin,
      refreshPins,
      isPinned,
      getPinCount,
    }
  };

  return (
    <PinContext.Provider value={value}>
      {children}
    </PinContext.Provider>
  );
};

// Hook for using pin context
export const usePins = (): PinContextType => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePins must be used within a PinProvider');
  }
  return context;
};
```

---

## API Integration

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

## Routing

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

## Styling Guidelines

For ChatPinner's browser extension, I'm using CSS-in-JS with styled-components to prevent conflicts with ChatGPT's existing Tailwind v4 classes while maintaining visual consistency with ChatGPT's design system.

### Styling Approach

**CSS-in-JS Strategy:**
- **styled-components**: Primary styling solution for component isolation
- **CSS Variables**: Leverage ChatGPT's existing design tokens from UI spec
- **Scoped Styles**: Each component's styles are isolated to prevent conflicts
- **Theme Integration**: Direct mapping to ChatGPT's visual design language

### Global Theme Variables

```css
/**
 * chatgpt-theme-variables.css
 *
 * CSS variables extracted from ChatGPT's design system.
 * These variables are used throughout the extension's styled components.
 */

:root {
  /* ChatGPT Color Palette - Light Mode */
  --brand-purple: #ab68ff;
  --brand-green: #00d4aa;
  --brand-red: #ff6b6b;

  /* Surface Colors */
  --main-surface-primary: #ffffff;
  --main-surface-secondary: #f8f9fa;
  --main-surface-tertiary: #e9ecef;
  --main-surface-selected: #f0f2ff;

  /* Text Colors */
  --text-primary: #212529;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-muted: rgba(0, 0, 0, 0.4);
  --text-inverse: #ffffff;

  /* Icon Colors */
  --icon-primary: #212529;
  --icon-secondary: #676767;
  --icon-muted: #adb5bd;
  --icon-inverse: #ffffff;

  /* Border Colors */
  --border-primary: #dee2e6;
  --border-secondary: #e9ecef;
  --border-subtle: rgba(0, 0, 0, 0.1);

  /* Spacing System */
  --spacing-unit: 4px;
  --spacing-xs: calc(var(--spacing-unit) * 1); /* 4px */
  --spacing-sm: calc(var(--spacing-unit) * 2); /* 8px */
  --spacing-md: calc(var(--spacing-unit) * 3); /* 12px */
  --spacing-lg: calc(var(--spacing-unit) * 4); /* 16px */
  --spacing-xl: calc(var(--spacing-unit) * 6); /* 24px */
  --spacing-2xl: calc(var(--spacing-unit) * 8); /* 32px */

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);

  /* Transitions */
  --transition-fast: 0.1s linear;
  --transition-normal: 0.2s linear;
  --transition-slow: 0.3s linear;
}

/* Dark Mode Variables */
[data-theme="dark"] {
  /* Surface Colors */
  --main-surface-primary: #343541;
  --main-surface-secondary: #2d2e3a;
  --main-surface-tertiary: #202123;
  --main-surface-selected: #2d2e3a;

  /* Text Colors */
  --text-primary: #ececf1;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --text-inverse: #343541;

  /* Icon Colors */
  --icon-primary: #ececf1;
  --icon-secondary: #8e8ea0;
  --icon-muted: #565869;
  --icon-inverse: #343541;

  /* Border Colors */
  --border-primary: #4e4f60;
  --border-secondary: #4e4f60;
  --border-subtle: rgba(255, 255, 255, 0.1);
}

/* ChatGPT-specific Extension Variables */
:root {
  /* Extension-specific colors */
  --pin-accent: var(--brand-purple);
  --pin-accent-hover: #9f5dff;
  --pin-accent-light: rgba(171, 104, 255, 0.1);

  /* Animation durations */
  --pin-animation-fast: 0.15s;
  --pin-animation-normal: 0.3s;
  --pin-animation-slow: 0.5s;

  /* Extension spacing */
  --pin-header-height: auto;
  --pin-item-height: 40px;
  --pin-button-size: 32px;
}
```

### Theme Integration in styled-components

```typescript
/**
 * chatgpt-theme.ts
 *
 * Theme object for use with styled-components.
 * Provides typed access to ChatGPT design variables.
 */
export const ChatGPTTheme = {
  colors: {
    brand: {
      purple: 'var(--brand-purple)',
      green: 'var(--brand-green)',
      red: 'var(--brand-red)',
    },
    surface: {
      primary: 'var(--main-surface-primary)',
      secondary: 'var(--main-surface-secondary)',
      tertiary: 'var(--main-surface-tertiary)',
      selected: 'var(--main-surface-selected)',
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      muted: 'var(--text-muted)',
      inverse: 'var(--text-inverse)',
    },
    icon: {
      primary: 'var(--icon-primary)',
      secondary: 'var(--icon-secondary)',
      muted: 'var(--icon-muted)',
      inverse: 'var(--icon-inverse)',
    },
    border: {
      primary: 'var(--border-primary)',
      secondary: 'var(--border-secondary)',
      subtle: 'var(--border-subtle)',
    },
    pin: {
      accent: 'var(--pin-accent)',
      accentHover: 'var(--pin-accent-hover)',
      accentLight: 'var(--pin-accent-light)',
    }
  },

  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
    unit: 'var(--spacing-unit)',
  },

  typography: {
    fontFamily: 'var(--font-family)',
    fontFamilyMono: 'var(--font-mono)',
    fontSize: {
      xs: 'var(--text-xs)',
      sm: 'var(--text-sm)',
      base: 'var(--text-base)',
      lg: 'var(--text-lg)',
      xl: 'var(--text-xl)',
      '2xl': 'var(--text-2xl)',
    },
    fontWeight: {
      light: 'var(--font-weight-light)',
      normal: 'var(--font-weight-normal)',
      medium: 'var(--font-weight-medium)',
      semibold: 'var(--font-weight-semibold)',
      bold: 'var(--font-weight-bold)',
    }
  },

  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },

  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },

  transitions: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)',
  },

  animations: {
    pinFast: 'var(--pin-animation-fast)',
    pinNormal: 'var(--pin-animation-normal)',
    pinSlow: 'var(--pin-animation-slow)',
  }
};

export type ChatGPTThemeType = typeof ChatGPTTheme;
```

---

## Testing Requirements

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

## Environment Configuration

For ChatPinner's browser extension development, I'm defining environment variables and configuration that support both development and production builds while maintaining security and performance requirements.

### Required Environment Variables

```typescript
/**
 * env-config.ts
 *
 * Environment configuration for ChatPinner browser extension.
 * Handles development vs production settings and feature flags.
 */

// Base configuration interface
interface EnvConfig {
  // Application metadata
  APP_NAME: string;
  APP_VERSION: string;
  APP_DESCRIPTION: string;

  // Extension settings
  EXTENSION_ID?: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ENABLE_EXPERIMENTAL_FEATURES: boolean;

  // API and storage settings
  STORAGE_PREFIX: string;
  MAX_PIN_COUNT: number;
  MAX_PIN_CONTENT_LENGTH: number;

  // Development settings
  DEV_MODE: boolean;
  HOT_RELOAD: boolean;
  MOCK_CHATGPT: boolean;

  // Performance settings
  NAVIGATION_TIMEOUT: number;
  DEBOUNCE_DELAY: number;
  MAX_STORAGE_SIZE: number;

  // UI settings
  THEME_AUTO_DETECT: boolean;
  DEFAULT_ANIMATION_DURATION: number;
  HIGHLIGHT_DURATION: number;
}

// Default configuration
const defaultConfig: EnvConfig = {
  APP_NAME: 'ChatPinner',
  APP_VERSION: process.env.npm_package_version || '1.0.0',
  APP_DESCRIPTION: 'Pin important messages in ChatGPT conversations',

  EXTENSION_ID: process.env.EXTENSION_ID,
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  LOG_LEVEL: (process.env.LOG_LEVEL as any) || (process.env.NODE_ENV === 'development' ? 'debug' : 'error'),

  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: process.env.ENABLE_ERROR_REPORTING === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_EXPERIMENTAL_FEATURES: process.env.ENABLE_EXPERIMENTAL_FEATURES === 'true',

  STORAGE_PREFIX: 'chatpinner_',
  MAX_PIN_COUNT: parseInt(process.env.MAX_PIN_COUNT || '100', 10),
  MAX_PIN_CONTENT_LENGTH: parseInt(process.env.MAX_PIN_CONTENT_LENGTH || '500', 10),

  DEV_MODE: process.env.NODE_ENV === 'development',
  HOT_RELOAD: process.env.HOT_RELOAD === 'true',
  MOCK_CHATGPT: process.env.MOCK_CHATGPT === 'true',

  NAVIGATION_TIMEOUT: parseInt(process.env.NAVIGATION_TIMEOUT || '5000', 10),
  DEBOUNCE_DELAY: parseInt(process.env.DEBOUNCE_DELAY || '300', 10),
  MAX_STORAGE_SIZE: parseInt(process.env.MAX_STORAGE_SIZE || '5242880', 10), // 5MB

  THEME_AUTO_DETECT: process.env.THEME_AUTO_DETECT !== 'false',
  DEFAULT_ANIMATION_DURATION: parseInt(process.env.DEFAULT_ANIMATION_DURATION || '300', 10),
  HIGHLIGHT_DURATION: parseInt(process.env.HIGHLIGHT_DURATION || '2000', 10),
};

// Get current environment
const getEnvironment = (): 'development' | 'test' | 'production' => {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
};

// Environment-specific overrides
const environmentOverrides: Partial<EnvConfig> = {
  development: {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: false,
    ENABLE_PERFORMANCE_MONITORING: true,
    DEV_MODE: true,
    HOT_RELOAD: true,
    MOCK_CHATGPT: false,
  },

  test: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: false,
    ENABLE_PERFORMANCE_MONITORING: false,
    DEV_MODE: true,
    HOT_RELOAD: false,
    MOCK_CHATGPT: true,
    NAVIGATION_TIMEOUT: 1000,
    DEBOUNCE_DELAY: 50,
  },

  production: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: false,
    DEV_MODE: false,
    HOT_RELOAD: false,
    MOCK_CHATGPT: false,
  }
};

// Final configuration
const config: EnvConfig = {
  ...defaultConfig,
  ...environmentOverrides[getEnvironment()],
};

export default config;
export type { EnvConfig };
```

### Environment Files Setup

```bash
# .env.example
# Copy this file to .env for local development

# Application settings
NODE_ENV=development
LOG_LEVEL=debug

# Extension settings
EXTENSION_ID=your-extension-id-here
DEBUG_MODE=true

# Feature flags
ENABLE_ANALYTICS=false
ENABLE_ERROR_REPORTING=false
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_EXPERIMENTAL_FEATURES=false

# Storage and performance limits
MAX_PIN_COUNT=100
MAX_PIN_CONTENT_LENGTH=500
MAX_STORAGE_SIZE=5242880

# Development settings
HOT_RELOAD=true
MOCK_CHATGPT=false

# Performance tuning
NAVIGATION_TIMEOUT=5000
DEBOUNCE_DELAY=300

# UI settings
THEME_AUTO_DETECT=true
DEFAULT_ANIMATION_DURATION=300
HIGHLIGHT_DURATION=2000
```

---

## Frontend Developer Standards

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

## Architecture Summary

### Key Architectural Decisions

1. **React + Plasmo Framework**: Optimal for browser extension development with React skills
2. **CSS-in-JS Strategy**: Prevents conflicts with ChatGPT's existing Tailwind v4 classes
3. **Content Script Architecture**: Seamless integration with ChatGPT's DOM structure
4. **chrome.storage.local**: Proper browser extension storage with quota management
5. **Component Isolation**: Modular design supporting future multi-platform expansion
6. **Performance-First**: <100ms load time and minimal ChatGPT impact
7. **Accessibility-First**: WCAG AA compliance throughout

### MVP Development Alignment

The architecture directly supports the 1-week MVP timeline through:
- **Focused Scope**: Essential features only for launch
- **Reusable Patterns**: Consistent component and hook patterns
- **Testing Strategy**: Balanced approach ensuring quality without overhead
- **Performance Targets**: Built-in monitoring and optimization
- **Developer Experience**: Clear standards and comprehensive documentation

### Next Steps

This architecture document provides the complete technical foundation for implementing ChatPinner's browser extension. The detailed specifications, code templates, and developer standards enable rapid development while maintaining code quality and preparing for future multi-platform expansion.

**Architecture is ready for development handoff! 🚀**

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-21 | v1.0 | Initial comprehensive frontend architecture creation | Winston (Architect) |

---

*This architecture document was generated using the BMAD™ Core architecture framework and is optimized for ChatPinner's 1-week MVP development timeline.*