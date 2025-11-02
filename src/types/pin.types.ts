/**
 * Pin Data Types
 *
 * Types for individual message pinning functionality in ChatPinner.
 * Extends existing conversation-level storage to support message-level pins.
 */

/**
 * Individual pin data for a ChatGPT message
 */
export interface PinData {
  /** Unique identifier for the pin */
  id: string

  /** ChatGPT message identifier */
  messageId: string

  /** Associated conversation identifier */
  conversationId: string

  /** Message content (truncated for storage efficiency) */
  content: string

  /** Message position in conversation */
  position: number

  /** Pin creation timestamp */
  createdAt: number

  /** Message author role */
  author: "user" | "assistant"

  /** Optional: Full message URL for direct access */
  messageUrl?: string

  /** Optional: Pin metadata */
  metadata?: {
    /** Original message length before truncation */
    originalLength?: number

    /** Whether content was truncated */
    isTruncated?: boolean

    /** Pin author notes */
    notes?: string

    /** Tags for organization */
    tags?: string[]
  }
}

/**
 * Pin creation request data (without auto-generated fields)
 */
export type CreatePinRequest = Omit<PinData, "id" | "createdAt">

/**
 * Storage structure for pins organized by conversation
 */
export interface PinStorage {
  /** Pins indexed by conversation ID for efficient retrieval */
  conversations: Record<string, PinData[]>

  /** Global metadata about the storage */
  metadata: {
    /** Total number of pins */
    totalPins: number

    /** Storage version for migration */
    version: number

    /** Last updated timestamp */
    lastUpdated: number

    /** Storage usage in bytes (approximate) */
    storageUsage: number
  }
}

/**
 * Pin storage operations result
 */
export interface PinOperationResult {
  /** Whether operation was successful */
  success: boolean

  /** Operation error message if any */
  error?: string

  /** Additional operation data */
  data?: {
    /** Affected pin ID */
    pinId?: string

    /** Number of pins affected */
    count?: number

    /** Storage usage after operation */
    storageUsage?: number
  }
}

/**
 * Pin query options for filtering and sorting
 */
export interface PinQueryOptions {
  /** Filter by conversation ID */
  conversationId?: string

  /** Filter by author role */
  author?: "user" | "assistant"

  /** Filter by creation date range */
  dateRange?: {
    from?: number
    to?: number
  }

  /** Search in content and metadata */
  searchQuery?: string

  /** Filter by tags */
  tags?: string[]

  /** Sort options */
  sortBy?: "createdAt" | "position" | "author"
  sortOrder?: "asc" | "desc"

  /** Pagination options */
  limit?: number
  offset?: number
}

/**
 * Pin statistics for a conversation or globally
 */
export interface PinStats {
  /** Total number of pins */
  totalPins: number

  /** Number of user message pins */
  userPins: number

  /** Number of assistant message pins */
  assistantPins: number

  /** Storage usage in bytes */
  storageUsage: number

  /** Number of conversations with pins */
  conversationsWithPins: number

  /** Oldest pin timestamp */
  oldestPin?: number

  /** Newest pin timestamp */
  newestPin?: number
}

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  /** Used storage in bytes */
  usedBytes: number

  /** Available storage in bytes */
  availableBytes: number

  /** Total storage quota in bytes (Chrome extension local storage: ~5MB) */
  quotaBytes: number

  /** Usage percentage */
  usagePercentage: number

  /** Whether storage is nearing capacity */
  isNearCapacity: boolean

  /** Whether storage quota is exceeded */
  isQuotaExceeded: boolean
}

/**
 * Pin cleanup options
 */
export interface PinCleanupOptions {
  /** Remove orphaned pins (pins without valid conversation references) */
  removeOrphaned?: boolean

  /** Remove pins older than specified timestamp */
  olderThan?: number

  /** Limit maximum pins per conversation */
  maxPinsPerConversation?: number

  /** Maximum total pins */
  maxTotalPins?: number

  /** Keep pins with specific tags */
  keepTags?: string[]

  /** Dry run mode - don't actually delete */
  dryRun?: boolean
}

/**
 * Pin cleanup result
 */
export interface PinCleanupResult {
  /** Number of pins removed */
  removedCount: number

  /** IDs of removed pins */
  removedIds: string[]

  /** Storage space freed in bytes */
  spaceFreed: number

  /** Cleanup errors */
  errors: Array<{
    pinId: string
    error: string
  }>

  /** Whether this was a dry run */
  dryRun: boolean
}
