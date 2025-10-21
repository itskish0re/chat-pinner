import '@testing-library/jest-dom'

// Mock Chrome APIs for testing
const mockChrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (typeof keys === 'function') {
          callback = keys
          keys = null
        }
        return Promise.resolve({})
      }),
      set: jest.fn((items, callback) => {
        if (typeof items === 'function') {
          callback = items
          items = null
        }
        return Promise.resolve()
      }),
      remove: jest.fn((keys, callback) => {
        if (typeof keys === 'function') {
          callback = keys
          keys = null
        }
        return Promise.resolve()
      }),
      clear: jest.fn((callback) => {
        if (typeof callback === 'function') {
          callback()
        }
        return Promise.resolve()
      })
    }
  },
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      if (typeof queryInfo === 'function') {
        callback = queryInfo
        queryInfo = null
      }
      return Promise.resolve([])
    }),
    sendMessage: jest.fn()
  }
}

// Set up global chrome mock
global.chrome = mockChrome as any

// Mock DOM environment for content scripts
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://chat.openai.com/',
    origin: 'https://chat.openai.com',
    hostname: 'chat.openai.com'
  },
  writable: true
})