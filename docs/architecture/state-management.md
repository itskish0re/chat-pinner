# State Management

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
