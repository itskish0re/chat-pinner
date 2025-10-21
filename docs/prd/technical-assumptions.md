# Technical Assumptions

## Repository Structure: Monorepo

The project will use a monorepo structure to support future multi-platform expansion while maintaining shared components and configuration. This approach enables efficient code sharing across ChatGPT, Claude, Gemini, and future platform implementations while keeping platform-specific code isolated and maintainable.

## Service Architecture

**Core Architecture:** Content script injection with isolated storage layer within a single browser extension

**Rationale:** This approach provides the simplest path to MVP while maintaining extensibility for future enhancements. The content script will handle DOM manipulation and user interactions, while the isolated storage layer ensures data persistence and separation from ChatGPT's native functionality.

**Components:**
- **Content Script:** DOM interaction, UI rendering, event handling
- **Background Script:** Storage management, cross-tab communication
- **Extension Storage:** chrome.storage.local for data persistence
- **CSS Injection:** Scoped styling to prevent conflicts

## Testing Requirements

**CRITICAL DECISION:** Unit + Integration testing approach for MVP

**Rationale:** While full testing pyramid would be ideal, the 1-week timeline requires focused testing on core functionality. Unit tests will cover storage operations and business logic, while integration tests will verify ChatGPT DOM interaction and UI functionality.

**Testing Scope:**
- **Unit Tests:** Storage operations, pin management logic, DOM analysis utilities
- **Integration Tests:** Pin creation/display workflow, navigation functionality, basic error handling
- **Manual Testing:** Cross-browser compatibility, visual integration, performance validation

## Additional Technical Assumptions and Requests

**Technology Stack Clarification:**
- **Framework:** React with Plasmo for extension development (as specified in brief)
- **Styling:** CSS-in-JS or styled-components for scoped styling that prevents Tailwind conflicts
- **Build Tools:** Plasmo's built-in build system with webpack configuration
- **Storage:** chrome.storage.local API for reliable extension storage
- **Development Environment:** Node.js, npm/yarn, Chrome Developer Tools

**ChatGPT Integration Assumptions:**
- ChatGPT's message elements have stable identifiers or patterns for reliable targeting
- ChatGPT's existing message action menu can be accessed or replicated with custom UI elements
- ChatGPT's responsive design accommodates additional sticky header elements
- ChatGPT allows third-party extensions to modify their DOM within acceptable store policy boundaries

**Performance Constraints:**
- Extension initialization must complete within <100ms to avoid impacting ChatGPT load time
- Pin storage and retrieval operations must complete within <50ms for responsive user experience
- Navigation scrolling must complete within <500ms for smooth user interaction
- Memory usage must remain minimal to avoid browser performance degradation

**Browser Extension Store Compliance:**
- Extension will comply with Chrome Web Store, Firefox Add-ons, and Edge Add-ons policies
- No prohibited automated interactions or deceptive UI practices
- Clear privacy policy and data handling documentation
- Proper permission requests limited to necessary functionality only

**Development and Deployment Requirements:**
- Source code will be structured for maintainability and future open-source contributions
- Extension will be packaged and published to all three major extension stores
- Version management and update strategy for extension maintenance
- Documentation for installation, usage, and troubleshooting

**Security and Privacy Assumptions:**
- No external API calls or data transmission to third-party services
- All data storage remains local to user's browser
- Content script isolation to prevent security vulnerabilities
- Minimal permission requests (activeTab for ChatGPT domains, storage for data persistence)
