import type { ChatPinnerStorage, PinnedChat } from "../../types"

/**
 * Chrome storage utilities for ChatPinner
 */

export const STORAGE_KEYS = {
  PINNED_CHATS: "chatpinner_pinned_chats",
  SETTINGS: "chatpinner_settings",
  // Message-level pinning storage keys
  PINS: "chatpinner_pins",
  PINS_METADATA: "chatpinner_pins_metadata"
}

export async function getPinnedChats(): Promise<PinnedChat[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PINNED_CHATS)
    return result[STORAGE_KEYS.PINNED_CHATS] || []
  } catch (error) {
    console.error("Error getting pinned chats:", error)
    return []
  }
}

export async function savePinnedChats(chats: PinnedChat[]): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.PINNED_CHATS]: chats
    })
  } catch (error) {
    console.error("Error saving pinned chats:", error)
    throw error
  }
}

export async function addPinnedChat(chat: PinnedChat): Promise<void> {
  try {
    const existingChats = await getPinnedChats()
    const updatedChats = [chat, ...existingChats]
    await savePinnedChats(updatedChats)
  } catch (error) {
    console.error("Error adding pinned chat:", error)
    throw error
  }
}

export async function removePinnedChat(chatId: string): Promise<void> {
  try {
    const existingChats = await getPinnedChats()
    const updatedChats = existingChats.filter((chat) => chat.id !== chatId)
    await savePinnedChats(updatedChats)
  } catch (error) {
    console.error("Error removing pinned chat:", error)
    throw error
  }
}

export async function updatePinnedChat(
  chatId: string,
  updates: Partial<PinnedChat>
): Promise<void> {
  try {
    const existingChats = await getPinnedChats()
    const updatedChats = existingChats.map((chat) =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    )
    await savePinnedChats(updatedChats)
  } catch (error) {
    console.error("Error updating pinned chat:", error)
    throw error
  }
}

export async function getSettings(): Promise<ChatPinnerStorage["settings"]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
    return (
      result[STORAGE_KEYS.SETTINGS] || {
        autoPin: false,
        maxPins: 50,
        theme: "auto"
      }
    )
  } catch (error) {
    console.error("Error getting settings:", error)
    return {
      autoPin: false,
      maxPins: 50,
      theme: "auto"
    }
  }
}

export async function saveSettings(
  settings: ChatPinnerStorage["settings"]
): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: settings
    })
  } catch (error) {
    console.error("Error saving settings:", error)
    throw error
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.PINNED_CHATS,
      STORAGE_KEYS.SETTINGS
    ])
  } catch (error) {
    console.error("Error clearing data:", error)
    throw error
  }
}

// Storage monitoring
export function onStorageChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      callback(changes)
    }
  })
}
