# Styling Guidelines

For ChatPinner's browser extension, I'm using CSS-in-JS with styled-components to prevent conflicts with ChatGPT's existing Tailwind v4 classes while maintaining visual consistency with ChatGPT's design system.

### Styling Approach

**CSS-in-JS Strategy:**
- **styled-components**: Primary styling solution for component isolation
- **CSS Variables**: Leverage ChatGPT's existing design tokens from UI spec
- **Scoped Styles**: Each component's styles are isolated to prevent conflicts
- **Theme Integration**: Direct mapping to ChatGPT's visual design language

### Global Theme Variables

```css
/**
 * chatgpt-theme-variables.css
 *
 * CSS variables extracted from ChatGPT's design system.
 * These variables are used throughout the extension's styled components.
 */

:root {
  /* ChatGPT Color Palette - Light Mode */
  --brand-purple: #ab68ff;
  --brand-green: #00d4aa;
  --brand-red: #ff6b6b;

  /* Surface Colors */
  --main-surface-primary: #ffffff;
  --main-surface-secondary: #f8f9fa;
  --main-surface-tertiary: #e9ecef;
  --main-surface-selected: #f0f2ff;

  /* Text Colors */
  --text-primary: #212529;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-muted: rgba(0, 0, 0, 0.4);
  --text-inverse: #ffffff;

  /* Icon Colors */
  --icon-primary: #212529;
  --icon-secondary: #676767;
  --icon-muted: #adb5bd;
  --icon-inverse: #ffffff;

  /* Border Colors */
  --border-primary: #dee2e6;
  --border-secondary: #e9ecef;
  --border-subtle: rgba(0, 0, 0, 0.1);

  /* Spacing System */
  --spacing-unit: 4px;
  --spacing-xs: calc(var(--spacing-unit) * 1); /* 4px */
  --spacing-sm: calc(var(--spacing-unit) * 2); /* 8px */
  --spacing-md: calc(var(--spacing-unit) * 3); /* 12px */
  --spacing-lg: calc(var(--spacing-unit) * 4); /* 16px */
  --spacing-xl: calc(var(--spacing-unit) * 6); /* 24px */
  --spacing-2xl: calc(var(--spacing-unit) * 8); /* 32px */

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);

  /* Transitions */
  --transition-fast: 0.1s linear;
  --transition-normal: 0.2s linear;
  --transition-slow: 0.3s linear;
}

/* Dark Mode Variables */
[data-theme="dark"] {
  /* Surface Colors */
  --main-surface-primary: #343541;
  --main-surface-secondary: #2d2e3a;
  --main-surface-tertiary: #202123;
  --main-surface-selected: #2d2e3a;

  /* Text Colors */
  --text-primary: #ececf1;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --text-inverse: #343541;

  /* Icon Colors */
  --icon-primary: #ececf1;
  --icon-secondary: #8e8ea0;
  --icon-muted: #565869;
  --icon-inverse: #343541;

  /* Border Colors */
  --border-primary: #4e4f60;
  --border-secondary: #4e4f60;
  --border-subtle: rgba(255, 255, 255, 0.1);
}

/* ChatGPT-specific Extension Variables */
:root {
  /* Extension-specific colors */
  --pin-accent: var(--brand-purple);
  --pin-accent-hover: #9f5dff;
  --pin-accent-light: rgba(171, 104, 255, 0.1);

  /* Animation durations */
  --pin-animation-fast: 0.15s;
  --pin-animation-normal: 0.3s;
  --pin-animation-slow: 0.5s;

  /* Extension spacing */
  --pin-header-height: auto;
  --pin-item-height: 40px;
  --pin-button-size: 32px;
}
```

### Theme Integration in styled-components

```typescript
/**
 * chatgpt-theme.ts
 *
 * Theme object for use with styled-components.
 * Provides typed access to ChatGPT design variables.
 */
export const ChatGPTTheme = {
  colors: {
    brand: {
      purple: 'var(--brand-purple)',
      green: 'var(--brand-green)',
      red: 'var(--brand-red)',
    },
    surface: {
      primary: 'var(--main-surface-primary)',
      secondary: 'var(--main-surface-secondary)',
      tertiary: 'var(--main-surface-tertiary)',
      selected: 'var(--main-surface-selected)',
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      muted: 'var(--text-muted)',
      inverse: 'var(--text-inverse)',
    },
    icon: {
      primary: 'var(--icon-primary)',
      secondary: 'var(--icon-secondary)',
      muted: 'var(--icon-muted)',
      inverse: 'var(--icon-inverse)',
    },
    border: {
      primary: 'var(--border-primary)',
      secondary: 'var(--border-secondary)',
      subtle: 'var(--border-subtle)',
    },
    pin: {
      accent: 'var(--pin-accent)',
      accentHover: 'var(--pin-accent-hover)',
      accentLight: 'var(--pin-accent-light)',
    }
  },

  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
    unit: 'var(--spacing-unit)',
  },

  typography: {
    fontFamily: 'var(--font-family)',
    fontFamilyMono: 'var(--font-mono)',
    fontSize: {
      xs: 'var(--text-xs)',
      sm: 'var(--text-sm)',
      base: 'var(--text-base)',
      lg: 'var(--text-lg)',
      xl: 'var(--text-xl)',
      '2xl': 'var(--text-2xl)',
    },
    fontWeight: {
      light: 'var(--font-weight-light)',
      normal: 'var(--font-weight-normal)',
      medium: 'var(--font-weight-medium)',
      semibold: 'var(--font-weight-semibold)',
      bold: 'var(--font-weight-bold)',
    }
  },

  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },

  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },

  transitions: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)',
  },

  animations: {
    pinFast: 'var(--pin-animation-fast)',
    pinNormal: 'var(--pin-animation-normal)',
    pinSlow: 'var(--pin-animation-slow)',
  }
};

export type ChatGPTThemeType = typeof ChatGPTTheme;
```

---
