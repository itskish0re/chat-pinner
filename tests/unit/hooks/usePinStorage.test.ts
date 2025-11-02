/**
 * usePinStorage Hook Integration Tests
 *
 * Integration tests for usePinStorage hook testing React state management,
 * error handling, and real-time updates.
 */

import { act, renderHook, waitFor } from "@testing-library/react"

import {
  useConversationPins,
  usePinStorage,
  useStorageInfo
} from "../../../src/contents/hooks/usePinStorage"
import {
  createPin,
  getAllPins,
  getPinsByConversation,
  getPinStats,
  getStorageQuota,
  isPinned,
  removePin,
  updatePinMetadata
} from "../../../src/contents/utils/storage-manager"
import type { CreatePinRequest } from "../../../src/types/pin.types"

// Mock storage manager functions
jest.mock("../../../src/contents/utils/storage-manager", () => ({
  createPin: jest.fn(),
  removePin: jest.fn(),
  isPinned: jest.fn(),
  getAllPins: jest.fn(),
  getPinsByConversation: jest.fn(),
  getPinStats: jest.fn(),
  getStorageQuota: jest.fn(),
  updatePinMetadata: jest.fn()
}))

// Mock storage utils
jest.mock("../../../src/contents/utils/storage-utils", () => ({
  onStorageChanged: jest.fn(() => jest.fn()) // Return cleanup function
}))

// Mock Chrome APIs
const mockChrome = {
  storage: {
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}

global.chrome = mockChrome as any

const mockCreatePin = createPin as jest.MockedFunction<typeof createPin>
const mockRemovePin = removePin as jest.MockedFunction<typeof removePin>
const mockIsPinned = isPinned as jest.MockedFunction<typeof isPinned>
const mockGetAllPins = getAllPins as jest.MockedFunction<typeof getAllPins>
const mockGetPinsByConversation = getPinsByConversation as jest.MockedFunction<
  typeof getPinsByConversation
>
const mockGetPinStats = getPinStats as jest.MockedFunction<typeof getPinStats>
const mockGetStorageQuota = getStorageQuota as jest.MockedFunction<
  typeof getStorageQuota
>
const mockUpdatePinMetadata = updatePinMetadata as jest.MockedFunction<
  typeof updatePinMetadata
>

describe("usePinStorage Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Basic functionality", () => {
    it("should initialize with loading state", () => {
      const { result } = renderHook(() => usePinStorage())

      expect(result.current.loading).toBe(true)
      expect(result.current.pins).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it("should load pins on mount", async () => {
      const mockPins = [
        {
          id: "pin1",
          messageId: "msg1",
          conversationId: "conv1",
          content: "Test content",
          author: "user" as const,
          position: 0,
          createdAt: Date.now()
        }
      ]

      mockGetAllPins.mockResolvedValue(mockPins)
      mockGetPinStats.mockResolvedValue({
        totalPins: 1,
        userPins: 1,
        assistantPins: 0,
        storageUsage: 1024,
        conversationsWithPins: 1
      })
      mockGetStorageQuota.mockResolvedValue({
        usedBytes: 1024,
        availableBytes: 5 * 1024 * 1024 - 1024,
        quotaBytes: 5 * 1024 * 1024,
        usagePercentage: 0.02,
        isNearCapacity: false,
        isQuotaExceeded: false
      })

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.pins).toEqual(mockPins)
      expect(result.current.stats?.totalPins).toBe(1)
      expect(result.current.quota?.usedBytes).toBe(1024)
    })

    it("should handle loading errors", async () => {
      mockGetAllPins.mockRejectedValue(new Error("Storage error"))

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe("Failed to load pins")
      expect(result.current.pins).toEqual([])
    })
  })

  describe("pinMessage functionality", () => {
    it("should pin a message successfully", async () => {
      const mockPinData: CreatePinRequest = {
        messageId: "msg123",
        conversationId: "conv123",
        content: "Test message",
        author: "user",
        position: 0
      }

      const mockResult = {
        success: true,
        data: { pinId: "newpin123" }
      }

      mockCreatePin.mockResolvedValue(mockResult)
      mockGetAllPins.mockResolvedValue([]) // Initial empty state

      const { result } = renderHook(() => usePinStorage("conv123"))

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock updated pins after creation
      const newPin = {
        id: "newpin123",
        ...mockPinData,
        createdAt: Date.now()
      }
      mockGetAllPins.mockResolvedValue([newPin])

      // Pin the message
      await act(async () => {
        const pinResult = await result.current.pinMessage(
          "msg123",
          "conv123",
          "Test message",
          "user",
          0
        )
        expect(pinResult.success).toBe(true)
        expect(pinResult.data?.pinId).toBe("newpin123")
      })

      expect(mockCreatePin).toHaveBeenCalledWith(mockPinData)
    })

    it("should handle pin creation errors", async () => {
      const mockResult = {
        success: false,
        error: "Message is already pinned"
      }

      mockCreatePin.mockResolvedValue(mockResult)
      mockGetAllPins.mockResolvedValue([])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const pinResult = await result.current.pinMessage(
          "msg123",
          "conv123",
          "Test message",
          "user",
          0
        )
        expect(pinResult.success).toBe(false)
        expect(pinResult.error).toBe("Message is already pinned")
      })

      expect(result.current.error).toBe("Message is already pinned")
    })
  })

  describe("unpinMessage functionality", () => {
    it("should unpin a message successfully", async () => {
      const mockResult = {
        success: true,
        data: { pinId: "pin123" }
      }

      mockRemovePin.mockResolvedValue(mockResult)
      mockGetAllPins.mockResolvedValue([
        {
          id: "pin123",
          messageId: "msg123",
          conversationId: "conv123",
          content: "Test content",
          author: "user",
          position: 0,
          createdAt: Date.now()
        }
      ])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock empty pins after removal
      mockGetAllPins.mockResolvedValue([])

      await act(async () => {
        const unpinResult = await result.current.unpinMessage("pin123")
        expect(unpinResult.success).toBe(true)
        expect(unpinResult.data?.pinId).toBe("pin123")
      })

      expect(mockRemovePin).toHaveBeenCalledWith("pin123")
    })

    it("should handle unpin errors", async () => {
      const mockResult = {
        success: false,
        error: "Pin not found"
      }

      mockRemovePin.mockResolvedValue(mockResult)
      mockGetAllPins.mockResolvedValue([])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const unpinResult = await result.current.unpinMessage("nonexistent")
        expect(unpinResult.success).toBe(false)
        expect(unpinResult.error).toBe("Pin not found")
      })

      expect(result.current.error).toBe("Failed to unpin message")
    })
  })

  describe("checkIsPinned functionality", () => {
    it("should check if message is pinned", async () => {
      const mockPin = {
        id: "pin123",
        messageId: "msg123",
        conversationId: "conv123",
        content: "Test content",
        author: "user" as const,
        position: 0,
        createdAt: Date.now()
      }

      mockIsPinned.mockResolvedValue(mockPin)
      mockGetAllPins.mockResolvedValue([])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const isPinnedResult = await result.current.checkIsPinned(
        "msg123",
        "conv123"
      )

      expect(isPinnedResult).toEqual(mockPin)
      expect(mockIsPinned).toHaveBeenCalledWith("msg123", "conv123")
    })

    it("should return null for non-pinned message", async () => {
      mockIsPinned.mockResolvedValue(null)
      mockGetAllPins.mockResolvedValue([])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const isPinnedResult = await result.current.checkIsPinned("nonexistent")

      expect(isPinnedResult).toBeNull()
    })
  })

  describe("updatePinNotes functionality", () => {
    it("should update pin notes successfully", async () => {
      const mockResult = {
        success: true,
        data: { pinId: "pin123" }
      }

      mockUpdatePinMetadata.mockResolvedValue(mockResult)
      mockGetAllPins.mockResolvedValue([
        {
          id: "pin123",
          messageId: "msg123",
          conversationId: "conv123",
          content: "Test content",
          author: "user",
          position: 0,
          createdAt: Date.now(),
          metadata: { notes: "old notes" }
        }
      ])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock updated pin with new notes
      mockGetAllPins.mockResolvedValue([
        {
          id: "pin123",
          messageId: "msg123",
          conversationId: "conv123",
          content: "Test content",
          author: "user",
          position: 0,
          createdAt: Date.now(),
          metadata: { notes: "new notes" }
        }
      ])

      await act(async () => {
        const updateResult = await result.current.updatePinNotes(
          "pin123",
          "new notes"
        )
        expect(updateResult.success).toBe(true)
      })

      expect(mockUpdatePinMetadata).toHaveBeenCalledWith("pin123", {
        notes: "new notes"
      })
    })
  })

  describe("refreshPins functionality", () => {
    it("should refresh pins with options", async () => {
      const mockFilteredPins = [
        {
          id: "pin1",
          messageId: "msg1",
          conversationId: "conv1",
          content: "User content",
          author: "user" as const,
          position: 0,
          createdAt: Date.now()
        }
      ]

      mockGetAllPins.mockResolvedValue(mockFilteredPins)
      mockGetPinStats.mockResolvedValue({
        totalPins: 1,
        userPins: 1,
        assistantPins: 0,
        storageUsage: 512,
        conversationsWithPins: 1
      })
      mockGetStorageQuota.mockResolvedValue({
        usedBytes: 512,
        availableBytes: 5 * 1024 * 1024 - 512,
        quotaBytes: 5 * 1024 * 1024,
        usagePercentage: 0.01,
        isNearCapacity: false,
        isQuotaExceeded: false
      })

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.refreshPins({ author: "user" })
      })

      expect(mockGetAllPins).toHaveBeenCalledWith({ author: "user" })
      expect(result.current.pins).toEqual(mockFilteredPins)
    })
  })

  describe("clearError functionality", () => {
    it("should clear error state", async () => {
      mockGetAllPins.mockRejectedValue(new Error("Test error"))

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe("Failed to load pins")

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("getPinsForConversation functionality", () => {
    it("should get pins for specific conversation", async () => {
      const mockConvPins = [
        {
          id: "pin1",
          messageId: "msg1",
          conversationId: "conv123",
          content: "Conv content",
          author: "user" as const,
          position: 0,
          createdAt: Date.now()
        }
      ]

      mockGetPinsByConversation.mockResolvedValue(mockConvPins)
      mockGetAllPins.mockResolvedValue([])

      const { result } = renderHook(() => usePinStorage())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const convPins = await result.current.getPinsForConversation("conv123")

      expect(convPins).toEqual(mockConvPins)
      expect(mockGetPinsByConversation).toHaveBeenCalledWith(
        "conv123",
        undefined
      )
    })
  })
})

describe("useConversationPins Hook", () => {
  it("should filter pins by conversation", async () => {
    const allPins = [
      {
        id: "pin1",
        messageId: "msg1",
        conversationId: "conv1",
        content: "Content 1",
        author: "user" as const,
        position: 0,
        createdAt: Date.now()
      },
      {
        id: "pin2",
        messageId: "msg2",
        conversationId: "conv2",
        content: "Content 2",
        author: "assistant" as const,
        position: 0,
        createdAt: Date.now()
      }
    ]

    mockGetAllPins.mockResolvedValue(allPins)
    mockGetPinStats.mockResolvedValue({
      totalPins: 2,
      userPins: 1,
      assistantPins: 1,
      storageUsage: 1024,
      conversationsWithPins: 2
    })
    mockGetStorageQuota.mockResolvedValue({
      usedBytes: 1024,
      availableBytes: 5 * 1024 * 1024 - 1024,
      quotaBytes: 5 * 1024 * 1024,
      usagePercentage: 0.02,
      isNearCapacity: false,
      isQuotaExceeded: false
    })

    const { result } = renderHook(() => useConversationPins("conv1"))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pins).toHaveLength(1)
    expect(result.current.pins[0].conversationId).toBe("conv1")
  })

  it("should handle null conversation ID", async () => {
    mockGetAllPins.mockResolvedValue([])
    mockGetPinStats.mockResolvedValue({
      totalPins: 0,
      userPins: 0,
      assistantPins: 0,
      storageUsage: 0,
      conversationsWithPins: 0
    })
    mockGetStorageQuota.mockResolvedValue({
      usedBytes: 0,
      availableBytes: 5 * 1024 * 1024,
      quotaBytes: 5 * 1024 * 1024,
      usagePercentage: 0,
      isNearCapacity: false,
      isQuotaExceeded: false
    })

    const { result } = renderHook(() => useConversationPins(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pins).toEqual([])
  })

  it("should override pinMessage for conversation-specific pinning", async () => {
    mockCreatePin.mockResolvedValue({
      success: true,
      data: { pinId: "newpin" }
    })
    mockGetAllPins.mockResolvedValue([])

    const { result } = renderHook(() => useConversationPins("conv123"))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      const pinResult = await result.current.pinMessage(
        "msg123",
        "Test content",
        "user",
        0
      )
      expect(pinResult.success).toBe(true)
    })

    expect(mockCreatePin).toHaveBeenCalledWith({
      messageId: "msg123",
      conversationId: "conv123",
      content: "Test content",
      author: "user",
      position: 0
    })
  })
})

describe("useStorageInfo Hook", () => {
  it("should provide storage information", async () => {
    const mockStats = {
      totalPins: 10,
      userPins: 6,
      assistantPins: 4,
      storageUsage: 2048,
      conversationsWithPins: 3,
      oldestPin: Date.now() - 7 * 24 * 60 * 60 * 1000,
      newestPin: Date.now()
    }

    const mockQuota = {
      usedBytes: 2048,
      availableBytes: 5 * 1024 * 1024 - 2048,
      quotaBytes: 5 * 1024 * 1024,
      usagePercentage: 0.04,
      isNearCapacity: false,
      isQuotaExceeded: false
    }

    mockGetPinStats.mockResolvedValue(mockStats)
    mockGetStorageQuota.mockResolvedValue(mockQuota)

    const { result } = renderHook(() => useStorageInfo())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.quota).toEqual(mockQuota)
    expect(result.current.error).toBeNull()
  })

  it("should handle storage info errors", async () => {
    mockGetPinStats.mockRejectedValue(new Error("Stats error"))

    const { result } = renderHook(() => useStorageInfo())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("Failed to load storage information")
    expect(result.current.stats).toBeNull()
    expect(result.current.quota).toBeNull()
  })

  it("should refresh storage info", async () => {
    const initialStats = {
      totalPins: 5,
      userPins: 3,
      assistantPins: 2,
      storageUsage: 1024,
      conversationsWithPins: 2
    }
    const updatedStats = {
      totalPins: 6,
      userPins: 3,
      assistantPins: 3,
      storageUsage: 1280,
      conversationsWithPins: 2
    }

    mockGetPinStats
      .mockResolvedValueOnce(initialStats)
      .mockResolvedValueOnce(updatedStats)
    mockGetStorageQuota.mockResolvedValue({
      usedBytes: 1024,
      availableBytes: 5 * 1024 * 1024 - 1024,
      quotaBytes: 5 * 1024 * 1024,
      usagePercentage: 0.02,
      isNearCapacity: false,
      isQuotaExceeded: false
    })

    const { result } = renderHook(() => useStorageInfo())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats?.totalPins).toBe(5)

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.stats?.totalPins).toBe(6)
    })
  })
})
