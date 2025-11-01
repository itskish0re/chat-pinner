// ChatGPT DOM types
export interface ChatGPTMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: number
}

export interface ChatGPTConversation {
  id: string
  title: string
  messages: ChatGPTMessage[]
  lastUpdated: number
}

// ChatPinner types
export interface PinnedChat {
  id: string
  title: string
  url: string
  conversation: ChatGPTConversation
  pinnedAt: number
  tags?: string[]
  notes?: string
}

export interface ChatPinnerState {
  pinnedChats: PinnedChat[]
  isVisible: boolean
  searchQuery: string
  selectedTags: string[]
}

// Chrome storage types
export interface ChatPinnerStorage {
  pinnedChats: PinnedChat[]
  settings: {
    autoPin: boolean
    maxPins: number
    theme: "light" | "dark" | "auto"
  }
}

// Component props types
export interface PinnedChatsListProps {
  chats: PinnedChat[]
  onUnpin: (chatId: string) => void
  onOpen: (chatId: string) => void
  onEditNotes: (chatId: string, notes: string) => void
}

export interface PinnedChatItemProps {
  chat: PinnedChat
  onUnpin: (chatId: string) => void
  onOpen: (chatId: string) => void
  onEditNotes: (chatId: string, notes: string) => void
}

// DOM element types for ChatGPT integration
export interface ChatGPTDOMElements {
  conversationItems: NodeListOf<Element>
  currentConversation: Element | null
  messageElements: NodeListOf<Element>
  inputElement: HTMLTextAreaElement | null
}

// Event types
export interface ChatPinterEvent {
  type: "chat-pin" | "chat-unpin" | "chat-open" | "settings-update"
  payload: any
  timestamp: number
}

// Action types for useReducer
export type ChatPinnerAction =
  | { type: "ADD_PINNED_CHAT"; payload: PinnedChat }
  | { type: "REMOVE_PINNED_CHAT"; payload: string }
  | {
      type: "UPDATE_PINNED_CHAT"
      payload: { id: string; updates: Partial<PinnedChat> }
    }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "TOGGLE_VISIBILITY" }
  | { type: "LOAD_PINNED_CHATS"; payload: PinnedChat[] }

// Chrome extension message types
export interface ChromeMessage {
  type: string
  payload?: any
  sender?: string
}
