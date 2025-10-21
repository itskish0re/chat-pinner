# Chrome Extension Debugging Workflow

This document outlines the debugging workflow for the ChatPinner Chrome extension development.

## Content Script Debugging

### 1. Enable Extension Developer Mode
1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle "Developer mode" in the top right
3. Load unpacked extension from the project's `build/chrome-mv3-dev` directory

### 2. Debug Content Scripts
1. Navigate to ChatGPT (`https://chat.openai.com/`)
2. Open Chrome Developer Tools (F12 or Ctrl+Shift+I)
3. Go to **Sources** tab
4. Under "Page", find your extension's content scripts in `chrome-extension://[extension-id]/`
5. Set breakpoints in your content scripts

### 3. Debug React Components
1. Install React Developer Tools extension
2. In Chrome DevTools, go to **Components** tab
3. Inspect React components injected by your content script
4. View component state, props, and hooks

### 4. Background Script Debugging
1. In `chrome://extensions/`, click on "background page" for your extension
2. This opens a separate DevTools window for background scripts
3. Debug background script execution and Chrome API calls

### 5. Console Logging Strategy
- Use `console.log()` for basic debugging
- Use `console.group()` and `console.groupEnd()` for organized logging
- Use `console.error()` for error conditions
- Use `console.table()` for structured data

### 6. Hot Reload Development
Run `npm run dev` for automatic rebuilds:
```bash
npm run dev
```
Then reload the extension in `chrome://extensions/`:
1. Click the refresh icon on your extension
2. Or use the keyboard shortcut `Ctrl+R` with the extensions page focused

### 7. Testing Chrome Storage
Debug Chrome storage API calls:
```javascript
// In DevTools console
chrome.storage.local.get(null, (data) => {
  console.log('All stored data:', data)
})
```

### 8. Network Requests
Monitor network requests from your extension:
1. Go to **Network** tab in DevTools
2. Filter by "Fetch/XHR" to see API calls
3. Check for CORS issues and proper headers

### 9. Content Script Injection Issues
Debug content script injection:
```javascript
// Check if content script is injected
console.log('Content script injected:', !!document.getElementById('chat-pinner-root'))
```

### 10. Performance Profiling
Monitor extension performance:
1. Go to **Performance** tab
2. Record performance while using the extension
3. Analyze CPU usage and memory allocation

## Common Issues and Solutions

### Content Script Not Loading
- Check manifest permissions and content_scripts configuration
- Verify URL patterns match target pages
- Check Chrome extensions page for error messages

### React Component Not Rendering
- Verify content script injection point
- Check for CSS conflicts with host page
- Ensure React 18 hydration is working correctly

### Chrome API Errors
- Verify permissions in manifest.json
- Check for async/await proper usage
- Use chrome.runtime.lastError for debugging

### Styling Issues
- Use CSS-in-JS to prevent conflicts
- Verify Shadow DOM usage if applicable
- Check z-index and positioning conflicts