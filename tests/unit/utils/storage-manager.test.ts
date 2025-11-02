/**
 * Storage Manager Unit Tests
 *
 * Unit tests for storage-manager.ts focusing on CRUD operations,
 * error handling, and storage quota management.
 */

import {
  automaticCleanup,
  cleanupStorage,
  createPin,
  getAllPins,
  getPinsByConversation,
  getPinStats,
  getStorageHealth,
  getStorageQuota,
  isPinned,
  removePin,
  updatePinMetadata
} from "../../../src/contents/utils/storage-manager"
import type {
  CreatePinRequest,
  PinCleanupOptions
} from "../../../src/types/pin.types"

// Mock automaticCleanup for quota exceeded test
jest.mock("../../../src/contents/utils/storage-manager", () => ({
  ...jest.requireActual("../../../src/contents/utils/storage-manager"),
  automaticCleanup: jest.fn()
}))

const mockAutomaticCleanup = automaticCleanup as jest.MockedFunction<
  typeof automaticCleanup
>

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}

// Set up global Chrome mock
global.chrome = mockChrome as any

// Mock console methods to avoid test output noise
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
  console.log = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.log = originalConsoleLog
})

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

describe("Storage Manager - CRUD Operations", () => {
  const mockPinData: CreatePinRequest = {
    messageId: "msg_123",
    conversationId: "conv_456",
    content: "Test message content",
    author: "user",
    position: 0
  }

  describe("createPin", () => {
    it("should create a pin successfully", async () => {
      // Mock empty storage
      mockChrome.storage.local.get.mockResolvedValue({})

      // Mock successful save
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      const result = await createPin(mockPinData)

      expect(result.success).toBe(true)
      expect(result.data?.pinId).toBeDefined()
      expect(mockChrome.storage.local.set).toHaveBeenCalled()
    })

    it("should reject duplicate pins for same message", async () => {
      // Mock existing pin
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: {
          conv_456: [
            {
              id: "pin_existing",
              messageId: "msg_123",
              conversationId: "conv_456",
              content: "Existing content",
              author: "user",
              position: 0,
              createdAt: Date.now()
            }
          ]
        }
      })

      const result = await createPin(mockPinData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Message is already pinned")
    })

    it("should validate required fields", async () => {
      const invalidPin = { ...mockPinData, messageId: "" }

      const result = await createPin(invalidPin)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Message ID is required")
    })

    it("should handle storage quota exceeded with automatic cleanup", async () => {
      // Mock empty storage initially
      mockChrome.storage.local.get.mockResolvedValue({})

      // Mock automatic cleanup to return successful cleanup
      mockAutomaticCleanup.mockResolvedValueOnce({
        removedCount: 5,
        removedIds: ["old1", "old2", "old3", "old4", "old5"],
        spaceFreed: 1024,
        errors: [],
        dryRun: false
      })

      // Mock quota exceeded error, then success after cleanup
      mockChrome.storage.local.set
        .mockRejectedValueOnce(new Error("QUOTA_BYTES_PER_ITEM quota exceeded"))
        .mockResolvedValueOnce(undefined)

      const result = await createPin(mockPinData)

      expect(result.success).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        "Storage quota exceeded, attempting automatic cleanup..."
      )
    })
  })

  describe("removePin", () => {
    it("should remove an existing pin", async () => {
      // Mock storage with existing pin
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: {
          conv_456: [
            {
              id: "pin_to_remove",
              messageId: "msg_123",
              conversationId: "conv_456",
              content: "Test content",
              author: "user",
              position: 0,
              createdAt: Date.now()
            }
          ]
        }
      })

      mockChrome.storage.local.set.mockResolvedValue(undefined)

      const result = await removePin("pin_to_remove")

      expect(result.success).toBe(true)
      expect(result.data?.pinId).toBe("pin_to_remove")
    })

    it("should return error for non-existent pin", async () => {
      // Mock empty storage
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await removePin("non_existent_pin")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Pin not found")
    })

    it("should validate pin ID", async () => {
      const result = await removePin("")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Pin ID is required")
    })
  })

  describe("isPinned", () => {
    it("should return pin data if message is pinned", async () => {
      const existingPin = {
        id: "pin_existing",
        messageId: "msg_123",
        conversationId: "conv_456",
        content: "Test content",
        author: "user",
        position: 0,
        createdAt: Date.now()
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: {
          conv_456: [existingPin]
        }
      })

      const result = await isPinned("msg_123")

      expect(result).toEqual(existingPin)
    })

    it("should return null if message is not pinned", async () => {
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await isPinned("msg_nonexistent")

      expect(result).toBeNull()
    })

    it("should search in specific conversation if provided", async () => {
      const existingPin = {
        id: "pin_existing",
        messageId: "msg_123",
        conversationId: "conv_456",
        content: "Test content",
        author: "user",
        position: 0,
        createdAt: Date.now()
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: {
          conv_456: [existingPin],
          conv_other: [] // Different conversation
        }
      })

      const result = await isPinned("msg_123", "conv_456")

      expect(result).toEqual(existingPin)
    })
  })

  describe("getAllPins", () => {
    it("should return all pins from storage", async () => {
      const mockPins = {
        conv_1: [
          {
            id: "pin1",
            messageId: "msg1",
            conversationId: "conv_1",
            content: "Content 1",
            author: "user",
            position: 0,
            createdAt: Date.now()
          }
        ],
        conv_2: [
          {
            id: "pin2",
            messageId: "msg2",
            conversationId: "conv_2",
            content: "Content 2",
            author: "assistant",
            position: 1,
            createdAt: Date.now()
          }
        ]
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      const result = await getAllPins()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("pin1")
      expect(result[1].id).toBe("pin2")
    })

    it("should apply filters", async () => {
      const mockPins = {
        conv_1: [
          {
            id: "pin1",
            messageId: "msg1",
            conversationId: "conv_1",
            content: "User content",
            author: "user",
            position: 0,
            createdAt: Date.now()
          }
        ],
        conv_2: [
          {
            id: "pin2",
            messageId: "msg2",
            conversationId: "conv_2",
            content: "Assistant content",
            author: "assistant",
            position: 1,
            createdAt: Date.now()
          }
        ]
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      // Filter by author
      const userPins = await getAllPins({ author: "user" })
      expect(userPins).toHaveLength(1)
      expect(userPins[0].author).toBe("user")

      // Filter by conversation
      const conv1Pins = await getAllPins({ conversationId: "conv_1" })
      expect(conv1Pins).toHaveLength(1)
      expect(conv1Pins[0].conversationId).toBe("conv_1")
    })
  })

  describe("getPinsByConversation", () => {
    it("should return pins for specific conversation", async () => {
      const mockPins = {
        conv_1: [
          {
            id: "pin1",
            messageId: "msg1",
            conversationId: "conv_1",
            content: "Content 1",
            author: "user",
            position: 0,
            createdAt: Date.now()
          }
        ],
        conv_2: [
          {
            id: "pin2",
            messageId: "msg2",
            conversationId: "conv_2",
            content: "Content 2",
            author: "assistant",
            position: 1,
            createdAt: Date.now()
          }
        ]
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      const result = await getPinsByConversation("conv_1")

      expect(result).toHaveLength(1)
      expect(result[0].conversationId).toBe("conv_1")
    })
  })
})

describe("Storage Manager - Stats and Quota", () => {
  describe("getPinStats", () => {
    it("should return correct statistics", async () => {
      const mockPins = {
        conv_1: [
          {
            id: "pin1",
            messageId: "msg1",
            conversationId: "conv_1",
            content: "User content",
            author: "user",
            position: 0,
            createdAt: 1000
          },
          {
            id: "pin2",
            messageId: "msg2",
            conversationId: "conv_1",
            content: "Assistant content",
            author: "assistant",
            position: 1,
            createdAt: 2000
          }
        ]
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins,
        chatpinner_pins_metadata: {
          totalPins: 2,
          version: 1,
          lastUpdated: Date.now(),
          storageUsage: 1024
        }
      })

      const stats = await getPinStats()

      expect(stats.totalPins).toBe(2)
      expect(stats.userPins).toBe(1)
      expect(stats.assistantPins).toBe(1)
      expect(stats.conversationsWithPins).toBe(1)
      expect(stats.oldestPin).toBe(1000)
      expect(stats.newestPin).toBe(2000)
    })
  })

  describe("getStorageQuota", () => {
    it("should return quota information", async () => {
      const mockStorage = {
        chatpinner_pins_metadata: {
          storageUsage: 1024 // 1KB
        }
      }

      mockChrome.storage.local.get.mockResolvedValue(mockStorage)

      const quota = await getStorageQuota()

      expect(quota.usedBytes).toBe(1024)
      expect(quota.quotaBytes).toBe(5 * 1024 * 1024) // 5MB
      expect(quota.availableBytes).toBe(5 * 1024 * 1024 - 1024)
      expect(quota.usagePercentage).toBeLessThan(1)
      expect(quota.isNearCapacity).toBe(false)
      expect(quota.isQuotaExceeded).toBe(false)
    })

    it("should detect near capacity condition", async () => {
      const mockStorage = {
        chatpinner_pins_metadata: {
          storageUsage: 4.5 * 1024 * 1024 // 4.5MB
        }
      }

      mockChrome.storage.local.get.mockResolvedValue(mockStorage)

      const quota = await getStorageQuota()

      expect(quota.isNearCapacity).toBe(true)
      expect(quota.usagePercentage).toBeGreaterThan(80)
    })
  })
})

describe("Storage Manager - Cleanup Operations", () => {
  const mockPins = {
    conv_1: [
      {
        id: "pin1",
        messageId: "msg1",
        conversationId: "conv_1",
        content: "Old content",
        author: "user",
        position: 0,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        metadata: { tags: ["important"] }
      }
    ],
    conv_2: [
      {
        id: "pin2",
        messageId: "msg2",
        conversationId: "conv_2",
        content: "Recent content",
        author: "assistant",
        position: 0,
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
      }
    ]
  }

  describe("cleanupStorage", () => {
    it("should perform dry run cleanup", async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      const options: PinCleanupOptions = {
        olderThan: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        dryRun: true
      }

      const result = await cleanupStorage(options)

      expect(result.dryRun).toBe(true)
      expect(result.removedCount).toBe(1)
      expect(result.removedIds).toContain("pin1")
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled()
    })

    it("should remove old pins in actual cleanup", async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      mockChrome.storage.local.set.mockResolvedValue(undefined)

      const options: PinCleanupOptions = {
        olderThan: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        dryRun: false
      }

      const result = await cleanupStorage(options)

      expect(result.dryRun).toBe(false)
      expect(result.removedCount).toBe(1)
      expect(mockChrome.storage.local.set).toHaveBeenCalled()
    })

    it("should keep pins with specified tags", async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: mockPins
      })

      const options: PinCleanupOptions = {
        olderThan: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        keepTags: ["important"],
        dryRun: false
      }

      const result = await cleanupStorage(options)

      expect(result.removedCount).toBe(0) // pin1 has 'important' tag
    })
  })

  describe("automaticCleanup", () => {
    it("should not cleanup when quota is healthy", async () => {
      // Mock healthy quota
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins_metadata: {
          storageUsage: 1024 // 1KB
        }
      })

      const result = await automaticCleanup()

      expect(result.removedCount).toBe(0)
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled()
    })

    it("should cleanup when quota is exceeded", async () => {
      // Mock exceeded quota
      mockChrome.storage.local.get
        .mockResolvedValueOnce({
          chatpinner_pins_metadata: {
            storageUsage: 5.2 * 1024 * 1024 // Exceeds 5MB quota
          }
        })
        .mockResolvedValue({
          chatpinner_pins: mockPins
        })

      mockChrome.storage.local.set.mockResolvedValue(undefined)

      // Mock conversation validation (for orphaned pin removal)
      jest.doMock("../../../src/contents/utils/conversation-id", () => ({
        validateConversationAccess: jest.fn().mockResolvedValue(false)
      }))

      const result = await automaticCleanup()

      expect(result.removedCount).toBeGreaterThan(0)
    })
  })

  describe("getStorageHealth", () => {
    it("should provide health recommendations", async () => {
      // Mock storage with many old pins
      const manyPins = {}
      for (let i = 0; i < 1500; i++) {
        manyPins[`conv_${i}`] = [
          {
            id: `pin_${i}`,
            messageId: `msg_${i}`,
            conversationId: `conv_${i}`,
            content: "Content ".repeat(100), // Large content
            author: i % 2 === 0 ? "user" : "assistant",
            position: 0,
            createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000 // Very old
          }
        ]
      }

      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: manyPins,
        chatpinner_pins_metadata: {
          storageUsage: 6 * 1024 * 1024, // 6MB
          totalPins: 1500,
          version: 1,
          lastUpdated: Date.now()
        }
      })

      const health = await getStorageHealth()

      expect(health.needsCleanup).toBe(true)
      expect(health.urgentCleanup).toBe(true)
      expect(health.recommendations.length).toBeGreaterThan(0)
      expect(
        health.recommendations.some((r) => r.includes("quota exceeded"))
      ).toBe(true)
    })
  })
})

describe("Storage Manager - Error Handling", () => {
  it("should handle Chrome storage errors gracefully", async () => {
    // Mock Chrome storage error
    mockChrome.storage.local.get.mockRejectedValue(
      new Error("Storage unavailable")
    )

    const result = await getAllPins()

    expect(result).toEqual([]) // Should return empty array on error
    expect(console.error).toHaveBeenCalled()
  })

  it("should handle pin validation errors", async () => {
    const invalidPin = {
      messageId: "msg_123",
      conversationId: "conv_456",
      content: "Test content",
      author: "invalid" as any, // Invalid author
      position: 0
    }

    const result = await createPin(invalidPin)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Author must be "user" or "assistant"')
  })

  it("should handle update metadata errors", async () => {
    const result = await updatePinMetadata("", { notes: "test" })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Pin ID is required")
  })
})
