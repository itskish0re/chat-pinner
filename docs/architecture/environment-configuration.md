# Environment Configuration

For ChatPinner's browser extension development, I'm defining environment variables and configuration that support both development and production builds while maintaining security and performance requirements.

### Required Environment Variables

```typescript
/**
 * env-config.ts
 *
 * Environment configuration for ChatPinner browser extension.
 * Handles development vs production settings and feature flags.
 */

// Base configuration interface
interface EnvConfig {
  // Application metadata
  APP_NAME: string;
  APP_VERSION: string;
  APP_DESCRIPTION: string;

  // Extension settings
  EXTENSION_ID?: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ENABLE_EXPERIMENTAL_FEATURES: boolean;

  // API and storage settings
  STORAGE_PREFIX: string;
  MAX_PIN_COUNT: number;
  MAX_PIN_CONTENT_LENGTH: number;

  // Development settings
  DEV_MODE: boolean;
  HOT_RELOAD: boolean;
  MOCK_CHATGPT: boolean;

  // Performance settings
  NAVIGATION_TIMEOUT: number;
  DEBOUNCE_DELAY: number;
  MAX_STORAGE_SIZE: number;

  // UI settings
  THEME_AUTO_DETECT: boolean;
  DEFAULT_ANIMATION_DURATION: number;
  HIGHLIGHT_DURATION: number;
}

// Default configuration
const defaultConfig: EnvConfig = {
  APP_NAME: 'ChatPinner',
  APP_VERSION: process.env.npm_package_version || '1.0.0',
  APP_DESCRIPTION: 'Pin important messages in ChatGPT conversations',

  EXTENSION_ID: process.env.EXTENSION_ID,
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  LOG_LEVEL: (process.env.LOG_LEVEL as any) || (process.env.NODE_ENV === 'development' ? 'debug' : 'error'),

  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: process.env.ENABLE_ERROR_REPORTING === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_EXPERIMENTAL_FEATURES: process.env.ENABLE_EXPERIMENTAL_FEATURES === 'true',

  STORAGE_PREFIX: 'chatpinner_',
  MAX_PIN_COUNT: parseInt(process.env.MAX_PIN_COUNT || '100', 10),
  MAX_PIN_CONTENT_LENGTH: parseInt(process.env.MAX_PIN_CONTENT_LENGTH || '500', 10),

  DEV_MODE: process.env.NODE_ENV === 'development',
  HOT_RELOAD: process.env.HOT_RELOAD === 'true',
  MOCK_CHATGPT: process.env.MOCK_CHATGPT === 'true',

  NAVIGATION_TIMEOUT: parseInt(process.env.NAVIGATION_TIMEOUT || '5000', 10),
  DEBOUNCE_DELAY: parseInt(process.env.DEBOUNCE_DELAY || '300', 10),
  MAX_STORAGE_SIZE: parseInt(process.env.MAX_STORAGE_SIZE || '5242880', 10), // 5MB

  THEME_AUTO_DETECT: process.env.THEME_AUTO_DETECT !== 'false',
  DEFAULT_ANIMATION_DURATION: parseInt(process.env.DEFAULT_ANIMATION_DURATION || '300', 10),
  HIGHLIGHT_DURATION: parseInt(process.env.HIGHLIGHT_DURATION || '2000', 10),
};

// Get current environment
const getEnvironment = (): 'development' | 'test' | 'production' => {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
};

// Environment-specific overrides
const environmentOverrides: Partial<EnvConfig> = {
  development: {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: false,
    ENABLE_PERFORMANCE_MONITORING: true,
    DEV_MODE: true,
    HOT_RELOAD: true,
    MOCK_CHATGPT: false,
  },

  test: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: false,
    ENABLE_PERFORMANCE_MONITORING: false,
    DEV_MODE: true,
    HOT_RELOAD: false,
    MOCK_CHATGPT: true,
    NAVIGATION_TIMEOUT: 1000,
    DEBOUNCE_DELAY: 50,
  },

  production: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: false,
    DEV_MODE: false,
    HOT_RELOAD: false,
    MOCK_CHATGPT: false,
  }
};

// Final configuration
const config: EnvConfig = {
  ...defaultConfig,
  ...environmentOverrides[getEnvironment()],
};

export default config;
export type { EnvConfig };
```

### Environment Files Setup

```bash
# .env.example
# Copy this file to .env for local development

# Application settings
NODE_ENV=development
LOG_LEVEL=debug

# Extension settings
EXTENSION_ID=your-extension-id-here
DEBUG_MODE=true

# Feature flags
ENABLE_ANALYTICS=false
ENABLE_ERROR_REPORTING=false
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_EXPERIMENTAL_FEATURES=false

# Storage and performance limits
MAX_PIN_COUNT=100
MAX_PIN_CONTENT_LENGTH=500
MAX_STORAGE_SIZE=5242880

# Development settings
HOT_RELOAD=true
MOCK_CHATGPT=false

# Performance tuning
NAVIGATION_TIMEOUT=5000
DEBOUNCE_DELAY=300

# UI settings
THEME_AUTO_DETECT=true
DEFAULT_ANIMATION_DURATION=300
HIGHLIGHT_DURATION=2000
```

---
