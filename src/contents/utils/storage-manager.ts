/**
 * Pin Storage Manager
 *
 * Core storage operations for message-level pinning functionality.
 * Provides CRUD operations with error handling, quota management, and validation.
 */

import type {
  CreatePinRequest,
  PinCleanupOptions,
  PinCleanupResult,
  PinData,
  PinOperationResult,
  PinQueryOptions,
  PinStats,
  PinStorage,
  StorageQuotaInfo
} from "../../types/pin.types"
import { STORAGE_KEYS } from "./storage-utils"

/**
 * Maximum content length before truncation (Chrome storage limit consideration)
 */
const MAX_CONTENT_LENGTH = 10000

/**
 * Maximum total pins per conversation (performance consideration)
 */
const MAX_PINS_PER_CONVERSATION = 100

/**
 * Storage version for migration support
 */
const STORAGE_VERSION = 1

/**
 * Generate unique pin ID
 * @returns Unique pin identifier
 */
function generatePinId(): string {
  return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Truncate content if necessary for storage efficiency
 * @param content Original message content
 * @returns Truncated content with metadata
 */
function truncateContent(content: string): {
  content: string
  isTruncated: boolean
  originalLength: number
} {
  const originalLength = content.length

  if (originalLength <= MAX_CONTENT_LENGTH) {
    return {
      content,
      isTruncated: false,
      originalLength
    }
  }

  return {
    content: content.substring(0, MAX_CONTENT_LENGTH) + "... [truncated]",
    isTruncated: true,
    originalLength
  }
}

/**
 * Validate pin data before storage
 * @param pinData Pin data to validate
 * @returns Validation result
 */
function validatePinData(pinData: CreatePinRequest): {
  isValid: boolean
  error?: string
} {
  if (!pinData.messageId?.trim()) {
    return { isValid: false, error: "Message ID is required" }
  }

  if (!pinData.conversationId?.trim()) {
    return { isValid: false, error: "Conversation ID is required" }
  }

  if (!pinData.content?.trim()) {
    return { isValid: false, error: "Content is required" }
  }

  if (typeof pinData.position !== "number" || pinData.position < 0) {
    return { isValid: false, error: "Position must be a non-negative number" }
  }

  if (!["user", "assistant"].includes(pinData.author)) {
    return { isValid: false, error: 'Author must be "user" or "assistant"' }
  }

  return { isValid: true }
}

/**
 * Get pin storage from Chrome storage with automatic cleanup
 * @returns Pin storage data
 */
async function getPinStorage(): Promise<PinStorage> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.PINS,
      STORAGE_KEYS.PINS_METADATA
    ])

    let pins = result[STORAGE_KEYS.PINS] || {}
    let metadata = result[STORAGE_KEYS.PINS_METADATA] || {
      totalPins: 0,
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
      storageUsage: 0
    }

    // Perform automatic cleanup on initialization if needed
    const needsCleanup = await shouldPerformCleanup(pins, metadata)
    if (needsCleanup) {
      console.log("Performing automatic storage cleanup on initialization...")
      const cleanupResult = await automaticCleanup()

      if (cleanupResult.removedCount > 0) {
        console.log(
          `Automatic cleanup removed ${cleanupResult.removedCount} pins`
        )

        // Reload storage after cleanup
        const updatedResult = await chrome.storage.local.get([
          STORAGE_KEYS.PINS,
          STORAGE_KEYS.PINS_METADATA
        ])
        pins = updatedResult[STORAGE_KEYS.PINS] || {}
        metadata = updatedResult[STORAGE_KEYS.PINS_METADATA] || {
          totalPins: 0,
          version: STORAGE_VERSION,
          lastUpdated: Date.now(),
          storageUsage: 0
        }
      }
    }

    return {
      conversations: pins,
      metadata
    }
  } catch (error) {
    console.error("Error getting pin storage:", error)
    return {
      conversations: {},
      metadata: {
        totalPins: 0,
        version: STORAGE_VERSION,
        lastUpdated: Date.now(),
        storageUsage: 0
      }
    }
  }
}

/**
 * Determine if automatic cleanup should be performed
 * @param pins Current pins data
 * @param metadata Current metadata
 * @returns True if cleanup should be performed
 */
async function shouldPerformCleanup(
  pins: Record<string, any[]>,
  metadata: any
): Promise<boolean> {
  try {
    // Don't cleanup if storage is empty or very new
    const totalPins = Object.values(pins).reduce(
      (total, convPins) => total + convPins.length,
      0
    )
    if (totalPins === 0 || totalPins < 10) {
      return false
    }

    // Check if metadata is old (cleanup hasn't run recently)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (metadata.lastUpdated && metadata.lastUpdated > oneWeekAgo) {
      return false
    }

    // Check storage quota
    const quota = await getStorageQuota()
    if (quota.isQuotaExceeded || quota.isNearCapacity) {
      return true
    }

    // Check for very old pins (older than 6 months)
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
    const hasOldPins = Object.values(pins).some((convPins) =>
      convPins.some((pin: any) => pin.createdAt && pin.createdAt < sixMonthsAgo)
    )
    if (hasOldPins) {
      return true
    }

    // Check for excessive number of pins
    if (totalPins > 1000) {
      return true
    }

    // Check version mismatch (migration needed)
    if (metadata.version !== STORAGE_VERSION) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error determining cleanup need:", error)
    return false
  }
}

/**
 * Save pin storage to Chrome storage
 * @param storage Pin storage data to save
 * @returns Operation result
 */
async function savePinStorage(
  storage: PinStorage
): Promise<PinOperationResult> {
  try {
    // Update metadata
    storage.metadata.lastUpdated = Date.now()
    storage.metadata.totalPins = Object.values(storage.conversations).reduce(
      (total, pins) => total + pins.length,
      0
    )

    // Estimate storage usage
    const storageString = JSON.stringify(storage)
    storage.metadata.storageUsage = new Blob([storageString]).size

    // Save to Chrome storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.PINS]: storage.conversations,
      [STORAGE_KEYS.PINS_METADATA]: storage.metadata
    })

    return {
      success: true,
      data: {
        storageUsage: storage.metadata.storageUsage
      }
    }
  } catch (error) {
    console.error("Error saving pin storage:", error)

    // Check for quota exceeded error
    if (error instanceof Error && error.message.includes("QUOTA")) {
      return {
        success: false,
        error:
          "Storage quota exceeded. Please remove some pins to free up space."
      }
    }

    return {
      success: false,
      error: "Failed to save pin data"
    }
  }
}

/**
 * Create a new pin
 * @param pinRequest Pin creation data
 * @returns Operation result with created pin ID
 */
export async function createPin(
  pinRequest: CreatePinRequest
): Promise<PinOperationResult> {
  try {
    // Validate input
    const validation = validatePinData(pinRequest)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Check existing pins for this message
    const existingPin = await isPinned(
      pinRequest.messageId,
      pinRequest.conversationId
    )
    if (existingPin) {
      return {
        success: false,
        error: "Message is already pinned"
      }
    }

    // Get current storage
    const storage = await getPinStorage()

    // Check conversation pin limit
    const conversationPins =
      storage.conversations[pinRequest.conversationId] || []
    if (conversationPins.length >= MAX_PINS_PER_CONVERSATION) {
      return {
        success: false,
        error: `Maximum ${MAX_PINS_PER_CONVERSATION} pins per conversation reached`
      }
    }

    // Process content
    const { content, isTruncated, originalLength } = truncateContent(
      pinRequest.content
    )

    // Create pin data
    const pinData: PinData = {
      id: generatePinId(),
      ...pinRequest,
      content,
      createdAt: Date.now(),
      metadata: {
        ...pinRequest.metadata,
        isTruncated,
        originalLength
      }
    }

    // Add to storage
    if (!storage.conversations[pinRequest.conversationId]) {
      storage.conversations[pinRequest.conversationId] = []
    }

    storage.conversations[pinRequest.conversationId].push(pinData)

    // Sort by position
    storage.conversations[pinRequest.conversationId].sort(
      (a, b) => a.position - b.position
    )

    // Save storage
    let saveResult = await savePinStorage(storage)

    // If quota exceeded, attempt automatic cleanup and retry
    if (!saveResult.success && saveResult.error?.includes("quota")) {
      console.warn("Storage quota exceeded, attempting automatic cleanup...")
      const cleanupResult = await automaticCleanup()

      if (cleanupResult.removedCount > 0) {
        console.log(
          `Automatic cleanup removed ${cleanupResult.removedCount} pins, retrying save...`
        )
        saveResult = await savePinStorage(storage)
      }
    }

    if (!saveResult.success) {
      return saveResult
    }

    return {
      success: true,
      data: {
        pinId: pinData.id,
        storageUsage: saveResult.data?.storageUsage
      }
    }
  } catch (error) {
    console.error("Error creating pin:", error)
    return {
      success: false,
      error: "Failed to create pin"
    }
  }
}

/**
 * Remove a pin by ID
 * @param pinId Pin ID to remove
 * @returns Operation result
 */
export async function removePin(pinId: string): Promise<PinOperationResult> {
  try {
    if (!pinId?.trim()) {
      return {
        success: false,
        error: "Pin ID is required"
      }
    }

    const storage = await getPinStorage()
    let removed = false

    // Find and remove pin
    for (const conversationId in storage.conversations) {
      const pins = storage.conversations[conversationId]
      const index = pins.findIndex((pin) => pin.id === pinId)

      if (index !== -1) {
        pins.splice(index, 1)

        // Remove empty conversation entries
        if (pins.length === 0) {
          delete storage.conversations[conversationId]
        }

        removed = true
        break
      }
    }

    if (!removed) {
      return {
        success: false,
        error: "Pin not found"
      }
    }

    // Save storage
    const saveResult = await savePinStorage(storage)

    if (!saveResult.success) {
      return saveResult
    }

    return {
      success: true,
      data: {
        pinId,
        storageUsage: saveResult.data?.storageUsage
      }
    }
  } catch (error) {
    console.error("Error removing pin:", error)
    return {
      success: false,
      error: "Failed to remove pin"
    }
  }
}

/**
 * Check if a message is pinned
 * @param messageId Message ID to check
 * @param conversationId Conversation ID (optional, but improves performance)
 * @returns Pin data if found, null otherwise
 */
export async function isPinned(
  messageId: string,
  conversationId?: string
): Promise<PinData | null> {
  try {
    if (!messageId?.trim()) {
      return null
    }

    const storage = await getPinStorage()

    // If conversation ID provided, check only that conversation
    if (conversationId) {
      const pins = storage.conversations[conversationId] || []
      return pins.find((pin) => pin.messageId === messageId) || null
    }

    // Search all conversations
    for (const convPins of Object.values(storage.conversations)) {
      const pin = convPins.find((p) => p.messageId === messageId)
      if (pin) {
        return pin
      }
    }

    return null
  } catch (error) {
    console.error("Error checking pin status:", error)
    return null
  }
}

/**
 * Get all pins from storage
 * @param options Query options for filtering and sorting
 * @returns Array of pins matching criteria
 */
export async function getAllPins(
  options?: PinQueryOptions
): Promise<PinData[]> {
  try {
    const storage = await getPinStorage()
    let allPins: PinData[] = []

    // Collect all pins from all conversations
    for (const pins of Object.values(storage.conversations)) {
      allPins.push(...pins)
    }

    // Apply filters
    if (options) {
      // Filter by conversation
      if (options.conversationId) {
        allPins = allPins.filter(
          (pin) => pin.conversationId === options.conversationId
        )
      }

      // Filter by author
      if (options.author) {
        allPins = allPins.filter((pin) => pin.author === options.author)
      }

      // Filter by date range
      if (options.dateRange) {
        if (options.dateRange.from) {
          allPins = allPins.filter(
            (pin) => pin.createdAt >= options.dateRange!.from
          )
        }
        if (options.dateRange.to) {
          allPins = allPins.filter(
            (pin) => pin.createdAt <= options.dateRange!.to
          )
        }
      }

      // Search query
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase()
        allPins = allPins.filter(
          (pin) =>
            pin.content.toLowerCase().includes(query) ||
            pin.metadata?.notes?.toLowerCase().includes(query) ||
            pin.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        allPins = allPins.filter((pin) =>
          pin.metadata?.tags?.some((tag) => options.tags!.includes(tag))
        )
      }

      // Sort
      if (options.sortBy) {
        allPins.sort((a, b) => {
          let aValue: any, bValue: any

          switch (options.sortBy) {
            case "createdAt":
              aValue = a.createdAt
              bValue = b.createdAt
              break
            case "position":
              aValue = a.position
              bValue = b.position
              break
            case "author":
              aValue = a.author
              bValue = b.author
              break
            default:
              return 0
          }

          if (aValue < bValue) return options.sortOrder === "desc" ? 1 : -1
          if (aValue > bValue) return options.sortOrder === "desc" ? -1 : 1
          return 0
        })
      }

      // Pagination
      if (options.offset) {
        allPins = allPins.slice(options.offset)
      }

      if (options.limit) {
        allPins = allPins.slice(0, options.limit)
      }
    }

    return allPins
  } catch (error) {
    console.error("Error getting all pins:", error)
    return []
  }
}

/**
 * Get pins for a specific conversation
 * @param conversationId Conversation ID
 * @param options Optional query options
 * @returns Array of pins for the conversation
 */
export async function getPinsByConversation(
  conversationId: string,
  options?: Omit<PinQueryOptions, "conversationId">
): Promise<PinData[]> {
  return getAllPins({ ...options, conversationId })
}

/**
 * Get storage statistics
 * @returns Pin statistics and storage usage information
 */
export async function getPinStats(): Promise<PinStats> {
  try {
    const storage = await getPinStorage()
    const allPins = await getAllPins()

    const userPins = allPins.filter((pin) => pin.author === "user").length
    const assistantPins = allPins.filter(
      (pin) => pin.author === "assistant"
    ).length

    const timestamps = allPins.map((pin) => pin.createdAt).sort((a, b) => a - b)

    return {
      totalPins: allPins.length,
      userPins,
      assistantPins,
      storageUsage: storage.metadata.storageUsage,
      conversationsWithPins: Object.keys(storage.conversations).length,
      oldestPin: timestamps[0],
      newestPin: timestamps[timestamps.length - 1]
    }
  } catch (error) {
    console.error("Error getting pin stats:", error)
    return {
      totalPins: 0,
      userPins: 0,
      assistantPins: 0,
      storageUsage: 0,
      conversationsWithPins: 0
    }
  }
}

/**
 * Get storage quota information
 * @returns Storage quota details
 */
export async function getStorageQuota(): Promise<StorageQuotaInfo> {
  try {
    // Chrome storage.local typically has ~5MB limit
    const QUOTA_BYTES = 5 * 1024 * 1024 // 5MB

    // Get current storage usage
    const storage = await getPinStorage()
    const usedBytes = storage.metadata.storageUsage

    const availableBytes = Math.max(0, QUOTA_BYTES - usedBytes)
    const usagePercentage = (usedBytes / QUOTA_BYTES) * 100

    return {
      usedBytes,
      availableBytes,
      quotaBytes: QUOTA_BYTES,
      usagePercentage,
      isNearCapacity: usagePercentage > 80,
      isQuotaExceeded: usagePercentage >= 100
    }
  } catch (error) {
    console.error("Error getting storage quota:", error)
    return {
      usedBytes: 0,
      availableBytes: 0,
      quotaBytes: 5 * 1024 * 1024,
      usagePercentage: 0,
      isNearCapacity: false,
      isQuotaExceeded: false
    }
  }
}

/**
 * Update pin metadata
 * @param pinId Pin ID to update
 * @param updates Metadata updates
 * @returns Operation result
 */
export async function updatePinMetadata(
  pinId: string,
  updates: Partial<PinData["metadata"]>
): Promise<PinOperationResult> {
  try {
    if (!pinId?.trim()) {
      return {
        success: false,
        error: "Pin ID is required"
      }
    }

    const storage = await getPinStorage()
    let updated = false

    // Find and update pin
    for (const conversationId in storage.conversations) {
      const pins = storage.conversations[conversationId]
      const pin = pins.find((p) => p.id === pinId)

      if (pin) {
        pin.metadata = {
          ...pin.metadata,
          ...updates
        }
        updated = true
        break
      }
    }

    if (!updated) {
      return {
        success: false,
        error: "Pin not found"
      }
    }

    // Save storage
    const saveResult = await savePinStorage(storage)

    if (!saveResult.success) {
      return saveResult
    }

    return {
      success: true,
      data: {
        pinId,
        storageUsage: saveResult.data?.storageUsage
      }
    }
  } catch (error) {
    console.error("Error updating pin metadata:", error)
    return {
      success: false,
      error: "Failed to update pin metadata"
    }
  }
}

/**
 * Cleanup orphaned pins and manage storage capacity
 * @param options Cleanup options
 * @returns Cleanup result
 */
export async function cleanupStorage(
  options: PinCleanupOptions = {}
): Promise<PinCleanupResult> {
  try {
    const storage = await getPinStorage()
    const removedIds: string[] = []
    let spaceFreed = 0
    const errors: Array<{ pinId: string; error: string }> = []

    // Get all pins for processing
    const allPins: PinData[] = []
    for (const [conversationId, pins] of Object.entries(
      storage.conversations
    )) {
      allPins.push(...pins.map((pin) => ({ ...pin, conversationId })))
    }

    // Filter pins based on options
    let pinsToRemove: PinData[] = []

    // Remove orphaned pins if requested
    if (options.removeOrphaned) {
      const { validateConversationAccess } = await import("./conversation-id")
      const orphanedPins: PinData[] = []

      for (const pin of allPins) {
        try {
          const isValid = await validateConversationAccess(pin.conversationId)
          if (!isValid) {
            orphanedPins.push(pin)
          }
        } catch (error) {
          console.error(
            `Error validating conversation ${pin.conversationId}:`,
            error
          )
          // Consider it orphaned if validation fails
          orphanedPins.push(pin)
        }
      }

      pinsToRemove.push(...orphanedPins)
    }

    // Remove pins older than specified date
    if (options.olderThan) {
      const oldPins = allPins.filter(
        (pin) => pin.createdAt < options.olderThan!
      )
      pinsToRemove.push(...oldPins)
    }

    // Limit pins per conversation
    if (options.maxPinsPerConversation) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [conversationId, pins] of Object.entries(
        storage.conversations
      )) {
        if (pins.length > options.maxPinsPerConversation) {
          // Sort by creation time (oldest first) and remove excess
          const sortedPins = [...pins].sort((a, b) => a.createdAt - b.createdAt)
          const excessPins = sortedPins.slice(
            0,
            pins.length - options.maxPinsPerConversation
          )
          pinsToRemove.push(...excessPins)
        }
      }
    }

    // Limit total pins
    if (options.maxTotalPins && allPins.length > options.maxTotalPins) {
      // Sort by creation time (oldest first) and remove excess
      const sortedPins = [...allPins].sort((a, b) => a.createdAt - b.createdAt)
      const excessPins = sortedPins.slice(
        0,
        allPins.length - options.maxTotalPins
      )
      pinsToRemove.push(...excessPins)
    }

    // Keep pins with specific tags (exclude from removal)
    if (options.keepTags && options.keepTags.length > 0) {
      pinsToRemove = pinsToRemove.filter((pin) => {
        const pinTags = pin.metadata?.tags || []
        const hasKeepTag = options.keepTags!.some((keepTag) =>
          pinTags.includes(keepTag)
        )
        return !hasKeepTag
      })
    }

    // Remove duplicates (same pin might be matched by multiple criteria)
    const uniquePinIds = new Set(pinsToRemove.map((pin) => pin.id))
    const finalPinsToRemove = pinsToRemove.filter((pin) =>
      uniquePinIds.has(pin.id)
    )

    if (!options.dryRun) {
      // Actually remove the pins
      for (const pin of finalPinsToRemove) {
        try {
          const result = await removePin(pin.id)
          if (result.success) {
            removedIds.push(pin.id)
            spaceFreed += JSON.stringify(pin).length // Approximate space freed
          } else {
            errors.push({
              pinId: pin.id,
              error: result.error || "Unknown error"
            })
          }
        } catch (error) {
          errors.push({
            pinId: pin.id,
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }
      }
    } else {
      // Dry run - just calculate what would be removed
      removedIds.push(...finalPinsToRemove.map((pin) => pin.id))
      spaceFreed = finalPinsToRemove.reduce(
        (total, pin) => total + JSON.stringify(pin).length,
        0
      )
    }

    return {
      removedCount: removedIds.length,
      removedIds,
      spaceFreed,
      errors,
      dryRun: !!options.dryRun
    }
  } catch (error) {
    console.error("Error during storage cleanup:", error)
    return {
      removedCount: 0,
      removedIds: [],
      spaceFreed: 0,
      errors: [
        {
          pinId: "system",
          error:
            error instanceof Error ? error.message : "Unknown cleanup error"
        }
      ],
      dryRun: !!options.dryRun
    }
  }
}

/**
 * Automatic storage cleanup when quota is exceeded
 * @returns Cleanup result
 */
export async function automaticCleanup(): Promise<PinCleanupResult> {
  try {
    const quota = await getStorageQuota()

    if (!quota.isQuotaExceeded && !quota.isNearCapacity) {
      return {
        removedCount: 0,
        removedIds: [],
        spaceFreed: 0,
        errors: [],
        dryRun: false
      }
    }

    // Progressive cleanup strategy
    const cleanupStrategies = [
      // 1. Remove orphaned pins
      {
        removeOrphaned: true,
        dryRun: false
      },
      // 2. Remove pins older than 6 months
      {
        olderThan: Date.now() - 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
        dryRun: false
      },
      // 3. Limit to 50 pins per conversation
      {
        maxPinsPerConversation: 50,
        dryRun: false
      },
      // 4. Limit to 500 total pins
      {
        maxTotalPins: 500,
        dryRun: false
      },
      // 5. Remove pins older than 3 months
      {
        olderThan: Date.now() - 3 * 30 * 24 * 60 * 60 * 1000, // 3 months
        dryRun: false
      }
    ]

    const totalResult: PinCleanupResult = {
      removedCount: 0,
      removedIds: [],
      spaceFreed: 0,
      errors: [],
      dryRun: false
    }

    for (const strategy of cleanupStrategies) {
      const result = await cleanupStorage(strategy)

      // Accumulate results
      totalResult.removedCount += result.removedCount
      totalResult.removedIds.push(...result.removedIds)
      totalResult.spaceFreed += result.spaceFreed
      totalResult.errors.push(...result.errors)

      // Check if we've freed enough space
      const newQuota = await getStorageQuota()
      if (!newQuota.isQuotaExceeded && !newQuota.isNearCapacity) {
        break
      }

      // Safety check: don't remove too many pins in one go
      if (totalResult.removedCount >= 100) {
        console.warn(
          "Automatic cleanup reached safety limit of 100 pins removed"
        )
        break
      }
    }

    return totalResult
  } catch (error) {
    console.error("Error during automatic cleanup:", error)
    return {
      removedCount: 0,
      removedIds: [],
      spaceFreed: 0,
      errors: [
        {
          pinId: "system",
          error:
            error instanceof Error ? error.message : "Automatic cleanup failed"
        }
      ],
      dryRun: false
    }
  }
}

/**
 * Get storage health and recommendations
 * @returns Storage health information
 */
export async function getStorageHealth(): Promise<{
  quota: StorageQuotaInfo
  stats: PinStats
  recommendations: string[]
  needsCleanup: boolean
  urgentCleanup: boolean
}> {
  const [quota, stats] = await Promise.all([getStorageQuota(), getPinStats()])

  const recommendations: string[] = []
  let needsCleanup = false
  let urgentCleanup = false

  // Check quota usage
  if (quota.isQuotaExceeded) {
    urgentCleanup = true
    recommendations.push("Storage quota exceeded. Immediate cleanup required.")
  } else if (quota.isNearCapacity) {
    needsCleanup = true
    recommendations.push(
      "Storage nearing capacity. Consider cleaning up old pins."
    )
  }

  // Check pin count
  if (stats.totalPins > 1000) {
    needsCleanup = true
    recommendations.push(
      "High number of pins. Consider removing old or unused pins."
    )
  }

  // Check conversations with many pins
  if (stats.conversationsWithPins > 100) {
    needsCleanup = true
    recommendations.push(
      "Many conversations with pins. Consider organizing or removing pins from old conversations."
    )
  }

  // Check for very old pins
  if (stats.oldestPin) {
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
    if (stats.oldestPin < sixMonthsAgo) {
      needsCleanup = true
      recommendations.push(
        "Some pins are older than 6 months. Consider removing old pins."
      )
    }
  }

  // Check storage efficiency
  if (stats.totalPins > 0) {
    const avgSizePerPin = stats.storageUsage / stats.totalPins
    if (avgSizePerPin > 5000) {
      // 5KB per pin seems high
      needsCleanup = true
      recommendations.push(
        "Some pins may have very large content. Consider truncating or removing large pins."
      )
    }
  }

  return {
    quota,
    stats,
    recommendations,
    needsCleanup,
    urgentCleanup
  }
}
