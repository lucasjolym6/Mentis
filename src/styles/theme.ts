// src/styles/theme.ts
export const mentisTheme = {
  colors: {
    primary: '#006BFF',
    primaryHover: '#0056d8',
    complementary: '#22D3EE',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF3FB',
    textLight: '#111827',
    textDark: '#F3F4F6',
    borderLight: '#E5E7EB',
    borderDark: '#1C2541',
    darkBg: '#0B132B',
  },
  motion: {
    hoverScale: 1.03,
    transition: 'ease-in-out 300ms',
  },
  radius: {
    card: '1rem',
    button: '0.75rem',
  },
  shadow: {
    soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
} as const

export type MentisTheme = typeof mentisTheme


