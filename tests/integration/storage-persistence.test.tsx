/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Storage Persistence Integration Tests
 *
 * Integration tests for testing storage persistence across browser sessions,
 * extension reloads, and cross-tab synchronization.
 */

import { act, render, screen, waitFor } from "@testing-library/react"
import React from "react"

import { usePinStorage } from "../../src/contents/hooks/usePinStorage"
import {
  createPin,
  getAllPins,
  removePin
} from "../../src/contents/utils/storage-manager"

// Mock Chrome APIs for persistence testing
const createMockChromeStorage = () => {
  const storage: Record<string, any> = {}

  return {
    storage: {
      local: {
        get: jest.fn().mockImplementation((keys) => {
          const result: Record<string, any> = {}
          if (typeof keys === "string") {
            if (storage[keys]) result[keys] = storage[keys]
          } else if (Array.isArray(keys)) {
            keys.forEach((key) => {
              if (storage[key]) result[key] = storage[key]
            })
          } else {
            // Object or undefined - return all storage
            Object.assign(result, storage)
          }
          return Promise.resolve(result)
        }),
        set: jest.fn().mockImplementation((items) => {
          Object.assign(storage, items)
          return Promise.resolve()
        }),
        remove: jest.fn().mockImplementation((keys) => {
          if (typeof keys === "string") {
            delete storage[keys]
          } else if (Array.isArray(keys)) {
            keys.forEach((key) => delete storage[key])
          }
          return Promise.resolve()
        }),
        clear: jest.fn().mockImplementation(() => {
          Object.keys(storage).forEach((key) => delete storage[key])
          return Promise.resolve()
        })
      },
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    }
  }
}

// Test component that uses usePinStorage hook
function TestComponent({ conversationId }: { conversationId?: string }) {
  const { pins, loading, error, pinMessage, unpinMessage, refreshPins } =
    usePinStorage(conversationId)

  const handlePinMessage = async () => {
    await pinMessage(
      "test_msg_123",
      conversationId || "test_conv_123",
      "Test message content for persistence",
      "user",
      0
    )
  }

  const handleUnpinMessage = async () => {
    if (pins.length > 0) {
      await unpinMessage(pins[0].id)
    }
  }

  const handleRefresh = async () => {
    await refreshPins()
  }

  return (
    <div>
      <div data-testid="loading">{loading ? "Loading..." : "Loaded"}</div>
      <div data-testid="error">{error || "No error"}</div>
      <div data-testid="pins-count">{pins.length}</div>
      <button onClick={handlePinMessage} data-testid="pin-button">
        Pin Message
      </button>
      <button onClick={handleUnpinMessage} data-testid="unpin-button">
        Unpin Message
      </button>
      <button onClick={handleRefresh} data-testid="refresh-button">
        Refresh
      </button>
      <div data-testid="pins-list">
        {pins.map((pin) => (
          <div key={pin.id} data-testid={`pin-${pin.id}`}>
            {pin.content}
          </div>
        ))}
      </div>
    </div>
  )
}

describe("Storage Persistence Integration Tests", () => {
  let mockChrome: any

  beforeEach(() => {
    mockChrome = createMockChromeStorage()
    global.chrome = mockChrome
    jest.clearAllMocks()
  })

  describe("Session Persistence", () => {
    it("should persist pins across component re-renders", async () => {
      const { rerender } = render(<TestComponent conversationId="conv123" />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Pin a message
      act(() => {
        screen.getByTestId("pin-button").click()
      })

      // Wait for pin to be created
      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      })

      // Re-render component (simulates re-mount)
      rerender(<TestComponent conversationId="conv123" />)

      // Wait for re-load
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Pin should still be there
      expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      expect(screen.getByTestId("pins-list")).toBeInTheDocument()
    })

    it("should maintain pin data integrity across sessions", async () => {
      // Create initial pin data
      const initialPin = {
        id: "persist_test_pin",
        messageId: "persist_msg_123",
        conversationId: "persist_conv_123",
        content: "Persistent test message",
        author: "user" as const,
        position: 0,
        createdAt: Date.now(),
        metadata: {
          notes: "Test notes for persistence",
          tags: ["test", "persistence"]
        }
      }

      // Simulate initial session
      mockChrome.storage.local.set({
        chatpinner_pins: {
          persist_conv_123: [initialPin]
        },
        chatpinner_pins_metadata: {
          totalPins: 1,
          version: 1,
          lastUpdated: Date.now(),
          storageUsage: JSON.stringify(initialPin).length
        }
      })

      // First session - load existing pins
      const { unmount } = render(
        <TestComponent conversationId="persist_conv_123" />
      )

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      expect(screen.getByTestId(`pin-${initialPin.id}`)).toHaveTextContent(
        "Persistent test message"
      )

      // Unmount component (simulate closing tab/extension)
      unmount()

      // Second session - re-render component
      render(<TestComponent conversationId="persist_conv_123" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Pin data should be preserved
      expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      expect(screen.getByTestId(`pin-${initialPin.id}`)).toHaveTextContent(
        "Persistent test message"
      )
    })

    it("should handle storage corruption gracefully", async () => {
      // Simulate corrupted storage data
      mockChrome.storage.local.set({
        chatpinner_pins: "invalid data that is not an object",
        chatpinner_pins_metadata: null
      })

      render(<TestComponent conversationId="conv123" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Should handle corruption gracefully and start fresh
      expect(screen.getByTestId("pins-count")).toHaveTextContent("0")
      expect(screen.getByTestId("error")).toHaveTextContent("No error")

      // Should be able to create new pins
      act(() => {
        screen.getByTestId("pin-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      })
    })
  })

  describe("Extension Reload Simulation", () => {
    it("should preserve pins after extension reload simulation", async () => {
      // Create pins before "extension reload"
      const { unmount } = render(<TestComponent conversationId="reload_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Create multiple pins
      act(() => {
        screen.getByTestId("pin-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      })

      // Create another pin with different data
      act(async () => {
        const result = await createPin({
          messageId: "reload_msg_456",
          conversationId: "reload_conv",
          content: "Second reload test message",
          author: "assistant",
          position: 1,
          metadata: { tags: ["reload"] }
        })
        expect(result.success).toBe(true)
      })

      // Unmount to simulate extension reload
      unmount()

      // Simulate extension reload by resetting Chrome mock but keeping storage
      const storageBeforeReload = { ...mockChrome.storage.local }
      mockChrome = createMockChromeStorage()

      // Restore storage data
      Object.assign(mockChrome.storage.local, storageBeforeReload)
      mockChrome.storage.local.get.mockImplementation((keys) => {
        const result: Record<string, any> = {}
        const storage = storageBeforeReload as any
        if (typeof keys === "string") {
          if (storage[keys]) result[keys] = storage[keys]
        } else if (Array.isArray(keys)) {
          keys.forEach((key) => {
            if (storage[key]) result[key] = storage[key]
          })
        } else {
          Object.assign(result, storage)
        }
        return Promise.resolve(result)
      })
      global.chrome = mockChrome

      // Reload extension (remount component)
      render(<TestComponent conversationId="reload_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // All pins should be preserved
      expect(screen.getByTestId("pins-count")).toHaveTextContent("2")
    })

    it("should maintain storage version compatibility", async () => {
      // Simulate storage with older version
      const oldVersionPin = {
        id: "old_version_pin",
        messageId: "old_msg_123",
        conversationId: "old_conv_123",
        content: "Old version message",
        author: "user" as const,
        position: 0,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days old
      }

      mockChrome.storage.local.set({
        chatpinner_pins: {
          old_conv_123: [oldVersionPin]
        },
        chatpinner_pins_metadata: {
          totalPins: 1,
          version: 0, // Old version
          lastUpdated: Date.now() - 30 * 24 * 60 * 60 * 1000,
          storageUsage: JSON.stringify(oldVersionPin).length
        }
      })

      render(<TestComponent conversationId="old_conv_123" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Should load old version data
      expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      expect(screen.getByTestId(`pin-${oldVersionPin.id}`)).toHaveTextContent(
        "Old version message"
      )

      // Should be able to add new pins (migration works)
      act(() => {
        screen.getByTestId("pin-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("2")
      })
    })
  })

  describe("Cross-Tab Synchronization", () => {
    it("should simulate cross-tab storage changes", async () => {
      const { rerender } = render(<TestComponent conversationId="sync_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      expect(screen.getByTestId("pins-count")).toHaveTextContent("0")

      // Simulate another tab adding a pin
      act(async () => {
        await createPin({
          messageId: "sync_msg_123",
          conversationId: "sync_conv",
          content: "Message from another tab",
          author: "assistant",
          position: 0
        })
      })

      // Refresh to simulate cross-tab sync
      act(() => {
        screen.getByTestId("refresh-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      })

      expect(screen.getByTestId("pins-list")).toHaveTextContent(
        "Message from another tab"
      )
    })

    it("should handle concurrent modifications", async () => {
      render(<TestComponent conversationId="concurrent_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Simulate concurrent pin creation from multiple sources
      const concurrentOperations = [
        createPin({
          messageId: "concurrent_msg_1",
          conversationId: "concurrent_conv",
          content: "Concurrent message 1",
          author: "user",
          position: 0
        }),
        createPin({
          messageId: "concurrent_msg_2",
          conversationId: "concurrent_conv",
          content: "Concurrent message 2",
          author: "assistant",
          position: 1
        }),
        createPin({
          messageId: "concurrent_msg_3",
          conversationId: "concurrent_conv",
          content: "Concurrent message 3",
          author: "user",
          position: 2
        })
      ]

      await act(async () => {
        await Promise.all(concurrentOperations)
      })

      // Refresh to see all concurrent changes
      act(() => {
        screen.getByTestId("refresh-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("3")
      })
    })
  })

  describe("Data Integrity and Validation", () => {
    it("should validate pin data on load", async () => {
      // Create storage with invalid pin data
      mockChrome.storage.local.set({
        chatpinner_pins: {
          invalid_conv: [
            {
              // Missing required fields
              id: "invalid_pin",
              content: "Invalid pin without required fields"
            },
            {
              // Valid pin
              id: "valid_pin",
              messageId: "valid_msg_123",
              conversationId: "invalid_conv",
              content: "Valid pin",
              author: "user",
              position: 0,
              createdAt: Date.now()
            }
          ]
        },
        chatpinner_pins_metadata: {
          totalPins: 2,
          version: 1,
          lastUpdated: Date.now(),
          storageUsage: 1024
        }
      })

      render(<TestComponent conversationId="invalid_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Should only load valid pins
      expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      expect(screen.getByTestId("pins-list")).toHaveTextContent("Valid pin")
    })

    it("should handle large datasets efficiently", async () => {
      // Create large dataset
      const largePinSet = []
      for (let i = 0; i < 100; i++) {
        largePinSet.push({
          id: `large_pin_${i}`,
          messageId: `large_msg_${i}`,
          conversationId: "large_conv",
          content: `Large content ${i} ${"x".repeat(100)}`, // Make content sizable
          author: i % 2 === 0 ? "user" : "assistant",
          position: i,
          createdAt: Date.now() - i * 1000
        })
      }

      mockChrome.storage.local.set({
        chatpinner_pins: {
          large_conv: largePinSet
        },
        chatpinner_pins_metadata: {
          totalPins: 100,
          version: 1,
          lastUpdated: Date.now(),
          storageUsage: JSON.stringify(largePinSet).length
        }
      })

      render(<TestComponent conversationId="large_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Should handle large dataset
      expect(screen.getByTestId("pins-count")).toHaveTextContent("100")
    })
  })

  describe("Error Recovery", () => {
    it("should recover from storage errors", async () => {
      // Mock storage error on first load
      mockChrome.storage.local.get.mockRejectedValueOnce(
        new Error("Storage unavailable")
      )

      render(<TestComponent conversationId="error_conv" />)

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded")
      })

      // Should handle error gracefully
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to load pins"
      )
      expect(screen.getByTestId("pins-count")).toHaveTextContent("0")

      // Mock storage recovery
      mockChrome.storage.local.get.mockResolvedValue({
        chatpinner_pins: {},
        chatpinner_pins_metadata: {
          totalPins: 0,
          version: 1,
          lastUpdated: Date.now(),
          storageUsage: 0
        }
      })

      // Should be able to recover and create pins
      act(() => {
        screen.getByTestId("pin-button").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("pins-count")).toHaveTextContent("1")
      })
    })
  })
})
