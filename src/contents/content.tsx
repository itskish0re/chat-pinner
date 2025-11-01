import React from "react"
import { createRoot } from "react-dom/client"
import styled from "styled-components"

// Main content script for ChatGPT integration
const ChatPinnerRoot: React.FC = () => {
  return (
    <PinnedChatsContainer id="chat-pinner-root">
      <PinnedChatsHeader>
        <Title>Chat Pinner</Title>
      </PinnedChatsHeader>
      <PinnedChatsList>
        <PlaceholderText>No pinned chats yet</PlaceholderText>
      </PinnedChatsList>
    </PinnedChatsContainer>
  )
}

// Styled components using styled-components to avoid conflicts with ChatGPT's Tailwind
const PinnedChatsContainer = styled.div`
  position: fixed;
  right: 20px;
  top: 100px;
  width: 300px;
  max-height: 500px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
`

const PinnedChatsHeader = styled.div`
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e5e5;
  font-weight: 600;
`

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  color: #303235;
`

const PinnedChatsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
`

const PlaceholderText = styled.p`
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 13px;
  margin: 0;
`

// Function to inject the React app into ChatGPT page
function injectChatPinner() {
  // Check if we're on ChatGPT and the app isn't already injected
  if (!window.location.hostname.includes("chat.openai.com")) {
    return
  }

  const existingRoot = document.getElementById("chat-pinner-root")
  if (existingRoot) {
    return // Already injected
  }

  // Create a container for our React app
  const container = document.createElement("div")
  container.id = "chat-pinner-container"
  document.body.appendChild(container)

  // Create and render the React app
  const root = createRoot(container)
  root.render(<ChatPinnerRoot />)

  console.log("ChatPiner content script injected")
}

// Inject the app when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectChatPinner)
} else {
  injectChatPinner()
}

// Also handle page navigation in ChatGPT SPA
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(injectChatPinner, 1000) // Delay for page to settle
  }
}).observe(document, { subtree: true, childList: true })

export default ChatPinnerRoot
