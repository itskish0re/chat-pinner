/**
 * Background script for ChatPinner extension
 * Handles storage, messaging between components, and background tasks
 */

// Background script entry point
console.log('ChatPinner background script loaded')

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)

  switch (message.type) {
    case 'GET_PINNED_CHATS':
      getPinnedChatsFromBackground()
        .then(chats => sendResponse({ success: true, data: chats }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Keep message channel open for async response

    case 'SAVE_PINNED_CHAT':
      savePinnedChatToBackground(message.payload)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'REMOVE_PINNED_CHAT':
      removePinnedChatFromBackground(message.payload.chatId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    default:
      console.warn('Unknown message type:', message.type)
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Extension install/update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('ChatPinner extension installed/updated:', details.reason)

  if (details.reason === 'install') {
    // Initialize default settings
    initializeDefaultSettings()
  }
})

// Initialize default settings on first install
async function initializeDefaultSettings() {
  try {
    const existingSettings = await chrome.storage.local.get('chatpinner_settings')
    if (!existingSettings.chatpinner_settings) {
      await chrome.storage.local.set({
        chatpinner_settings: {
          autoPin: false,
          maxPins: 50,
          theme: 'auto'
        }
      })
    }
  } catch (error) {
    console.error('Error initializing settings:', error)
  }
}

// Storage helper functions for background script
async function getPinnedChatsFromBackground() {
  const result = await chrome.storage.local.get('chatpinner_pinned_chats')
  return result.chatpinner_pinned_chats || []
}

async function savePinnedChatToBackground(chat) {
  const existingChats = await getPinnedChatsFromBackground()
  const updatedChats = [chat, ...existingChats]
  await chrome.storage.local.set({ chatpinner_pinned_chats: updatedChats })
}

async function removePinnedChatFromBackground(chatId) {
  const existingChats = await getPinnedChatsFromBackground()
  const updatedChats = existingChats.filter(chat => chat.id !== chatId)
  await chrome.storage.local.set({ chatpinner_pinned_chats: updatedChats })
}