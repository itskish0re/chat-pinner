/**
 * usePinStorage Hook
 *
 * React hook for integrating pin storage functionality with components.
 * Provides state management, error handling, and real-time updates for pin operations.
 */

import { useCallback, useEffect, useRef, useState } from "react"

import type {
  CreatePinRequest,
  PinData,
  PinOperationResult,
  PinQueryOptions,
  PinStats,
  StorageQuotaInfo
} from "../../types/pin.types"
import {
  createPin,
  getAllPins,
  getPinsByConversation,
  getPinStats,
  getStorageQuota,
  isPinned,
  removePin,
  updatePinMetadata
} from "../utils/storage-manager"
import { onStorageChanged } from "../utils/storage-utils"

/**
 * Hook state interface
 */
interface UsePinStorageState {
  pins: PinData[]
  loading: boolean
  error: string | null
  stats: PinStats | null
  quota: StorageQuotaInfo | null
  currentConversationId: string | null
}

/**
 * Hook return value interface
 */
interface UsePinStorageReturn extends UsePinStorageState {
  // Actions
  pinMessage: (
    messageId: string,
    conversationId: string,
    content: string,
    author: "user" | "assistant",
    position?: number,
    metadata?: any
  ) => Promise<PinOperationResult>
  unpinMessage: (pinId: string) => Promise<PinOperationResult>
  checkIsPinned: (
    messageId: string,
    conversationId?: string
  ) => Promise<PinData | null>
  refreshPins: (options?: PinQueryOptions) => Promise<void>
  updatePinNotes: (pinId: string, notes: string) => Promise<PinOperationResult>
  updatePinTags: (pinId: string, tags: string[]) => Promise<PinOperationResult>

  // Utility methods
  getPinsForConversation: (
    conversationId: string,
    options?: Omit<PinQueryOptions, "conversationId">
  ) => Promise<PinData[]>
  clearError: () => void
}

/**
 * Custom hook for pin storage functionality
 * @param initialConversationId Optional initial conversation ID
 * @returns Hook state and actions
 */
export function usePinStorage(
  initialConversationId?: string
): UsePinStorageReturn {
  // State management
  const [state, setState] = useState<UsePinStorageState>({
    pins: [],
    loading: true,
    error: null,
    stats: null,
    quota: null,
    currentConversationId: initialConversationId || null
  })

  // Refs for preventing memory leaks and duplicate operations
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)

  /**
   * Safe state setter that checks if component is mounted
   */
  const safeSetState = useCallback(
    (updater: (prev: UsePinStorageState) => UsePinStorageState) => {
      if (mountedRef.current) {
        setState(updater)
      }
    },
    []
  )

  /**
   * Load pins from storage
   */
  const loadPins = useCallback(
    async (options?: PinQueryOptions) => {
      if (loadingRef.current) return

      loadingRef.current = true
      safeSetState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const pins = await getAllPins(options)
        const [stats, quota] = await Promise.all([
          getPinStats(),
          getStorageQuota()
        ])

        if (mountedRef.current) {
          safeSetState((prev) => ({
            ...prev,
            pins,
            loading: false,
            stats,
            quota
          }))
        }
      } catch (error) {
        console.error("Error loading pins:", error)
        if (mountedRef.current) {
          safeSetState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to load pins"
          }))
        }
      } finally {
        loadingRef.current = false
      }
    },
    [safeSetState]
  )

  /**
   * Pin a message
   */
  const pinMessage = useCallback(
    async (
      messageId: string,
      conversationId: string,
      content: string,
      author: "user" | "assistant",
      position: number = 0,
      metadata?: any
    ): Promise<PinOperationResult> => {
      try {
        safeSetState((prev) => ({ ...prev, error: null }))

        const pinRequest: CreatePinRequest = {
          messageId,
          conversationId,
          content,
          author,
          position,
          metadata
        }

        const result = await createPin(pinRequest)

        if (result.success) {
          // Refresh pins after successful creation
          await loadPins()
        } else {
          safeSetState((prev) => ({
            ...prev,
            error: result.error || "Failed to pin message"
          }))
        }

        return result
      } catch (error) {
        console.error("Error pinning message:", error)
        const errorMessage = "Failed to pin message"
        safeSetState((prev) => ({ ...prev, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [loadPins, safeSetState]
  )

  /**
   * Unpin a message
   */
  const unpinMessage = useCallback(
    async (pinId: string): Promise<PinOperationResult> => {
      try {
        safeSetState((prev) => ({ ...prev, error: null }))

        const result = await removePin(pinId)

        if (result.success) {
          // Refresh pins after successful removal
          await loadPins()
        } else {
          safeSetState((prev) => ({
            ...prev,
            error: result.error || "Failed to unpin message"
          }))
        }

        return result
      } catch (error) {
        console.error("Error unpinning message:", error)
        const errorMessage = "Failed to unpin message"
        safeSetState((prev) => ({ ...prev, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [loadPins, safeSetState]
  )

  /**
   * Check if a message is pinned
   */
  const checkIsPinned = useCallback(
    async (
      messageId: string,
      conversationId?: string
    ): Promise<PinData | null> => {
      try {
        return await isPinned(messageId, conversationId)
      } catch (error) {
        console.error("Error checking pin status:", error)
        return null
      }
    },
    []
  )

  /**
   * Refresh pins from storage
   */
  const refreshPins = useCallback(
    async (options?: PinQueryOptions) => {
      await loadPins(options)
    },
    [loadPins]
  )

  /**
   * Update pin notes
   */
  const updatePinNotes = useCallback(
    async (pinId: string, notes: string): Promise<PinOperationResult> => {
      try {
        safeSetState((prev) => ({ ...prev, error: null }))

        const result = await updatePinMetadata(pinId, { notes })

        if (result.success) {
          await loadPins()
        } else {
          safeSetState((prev) => ({
            ...prev,
            error: result.error || "Failed to update pin notes"
          }))
        }

        return result
      } catch (error) {
        console.error("Error updating pin notes:", error)
        const errorMessage = "Failed to update pin notes"
        safeSetState((prev) => ({ ...prev, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [loadPins, safeSetState]
  )

  /**
   * Update pin tags
   */
  const updatePinTags = useCallback(
    async (pinId: string, tags: string[]): Promise<PinOperationResult> => {
      try {
        safeSetState((prev) => ({ ...prev, error: null }))

        const result = await updatePinMetadata(pinId, { tags })

        if (result.success) {
          await loadPins()
        } else {
          safeSetState((prev) => ({
            ...prev,
            error: result.error || "Failed to update pin tags"
          }))
        }

        return result
      } catch (error) {
        console.error("Error updating pin tags:", error)
        const errorMessage = "Failed to update pin tags"
        safeSetState((prev) => ({ ...prev, error: errorMessage }))
        return { success: false, error: errorMessage }
      }
    },
    [loadPins, safeSetState]
  )

  /**
   * Get pins for a specific conversation
   */
  const getPinsForConversation = useCallback(
    async (
      conversationId: string,
      options?: Omit<PinQueryOptions, "conversationId">
    ): Promise<PinData[]> => {
      try {
        return await getPinsByConversation(conversationId, options)
      } catch (error) {
        console.error("Error getting conversation pins:", error)
        return []
      }
    },
    []
  )

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    safeSetState((prev) => ({ ...prev, error: null }))
  }, [safeSetState])

  /**
   * Set current conversation ID
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setCurrentConversationId = useCallback(
    (conversationId: string | null) => {
      safeSetState((prev) => ({
        ...prev,
        currentConversationId: conversationId
      }))
    },
    [safeSetState]
  )

  // Initialize hook
  useEffect(() => {
    loadPins()

    // Set up storage change listener for cross-tab synchronization
    const handleStorageChange = async (changes: any) => {
      // Check if pins or metadata changed
      if (changes.chatpinner_pins || changes.chatpinner_pins_metadata) {
        await loadPins()
      }
    }

    onStorageChanged(handleStorageChange)

    // Cleanup
    return () => {
      mountedRef.current = false
      // Note: Chrome storage listeners don't return unsubscribe functions
      // They persist for the lifetime of the extension context
    }
  }, [loadPins])

  // Auto-refresh when conversation changes
  useEffect(() => {
    if (state.currentConversationId) {
      loadPins({ conversationId: state.currentConversationId })
    }
  }, [state.currentConversationId, loadPins])

  return {
    ...state,
    pinMessage,
    unpinMessage,
    checkIsPinned,
    refreshPins,
    updatePinNotes,
    updatePinTags,
    getPinsForConversation,
    clearError
  }
}

/**
 * Hook for managing pins in a specific conversation
 * @param conversationId Conversation ID to focus on
 * @returns Hook state and actions filtered by conversation
 */
export function useConversationPins(conversationId: string | null) {
  const pinStorage = usePinStorage(conversationId || undefined)

  const [conversationPins, setConversationPins] = useState<PinData[]>([])
  const [loading, setLoading] = useState(true)

  // Filter pins by conversation
  useEffect(() => {
    if (conversationId) {
      const filtered = pinStorage.pins.filter(
        (pin) => pin.conversationId === conversationId
      )
      setConversationPins(filtered)
      setLoading(pinStorage.loading)
    } else {
      setConversationPins([])
      setLoading(false)
    }
  }, [pinStorage.pins, conversationId, pinStorage.loading])

  return {
    ...pinStorage,
    pins: conversationPins,
    loading,
    // Override methods to be conversation-specific
    pinMessage: (
      messageId: string,
      content: string,
      author: "user" | "assistant",
      position?: number,
      metadata?: any
    ) =>
      conversationId
        ? pinStorage.pinMessage(
            messageId,
            conversationId,
            content,
            author,
            position,
            metadata
          )
        : Promise.resolve({
            success: false,
            error: "No conversation ID provided"
          }),

    checkIsPinned: (messageId: string) =>
      conversationId
        ? pinStorage.checkIsPinned(messageId, conversationId)
        : Promise.resolve(null)
  }
}

/**
 * Hook for managing storage quota and stats
 * @returns Storage statistics and quota information
 */
export function useStorageInfo() {
  const [stats, setStats] = useState<PinStats | null>(null)
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInfo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, quotaData] = await Promise.all([
        getPinStats(),
        getStorageQuota()
      ])

      setStats(statsData)
      setQuota(quotaData)
    } catch (err) {
      console.error("Error loading storage info:", err)
      setError("Failed to load storage information")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInfo()

    // Set up periodic refresh
    const interval = setInterval(loadInfo, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [loadInfo])

  return {
    stats,
    quota,
    loading,
    error,
    refresh: loadInfo
  }
}
