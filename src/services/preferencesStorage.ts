const THEME_KEY = 'new-security.theme.v1';

export function readStoredTheme(): 'light' | 'dark' {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // O tema ainda se aplica à sessão atual.
  }
}
