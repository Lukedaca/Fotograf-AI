const API_KEY_STORAGE_KEY = 'fotograf_user_api_key_v1';
const SESSION_ONLY_KEY = 'fotograf_api_key_session_only_v1';

export const apiKeyManager = {
  save(key: string): void {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
  },

  get(): string | null {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!stored) return null;
    return stored.trim() || null;
  },

  clear(): void {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  },

  exists(): boolean {
    return !!this.get();
  },

  setSessionOnly(enabled: boolean): void {
    localStorage.setItem(SESSION_ONLY_KEY, enabled ? '1' : '0');
  },

  isSessionOnly(): boolean {
    return localStorage.getItem(SESSION_ONLY_KEY) === '1';
  },

  enableSessionOnlyAutoClear(): void {
    window.addEventListener('beforeunload', () => {
      if (this.isSessionOnly()) {
        this.clear();
      }
    });
  },

  clearLegacyKeys(): void {
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('artifex_user_api_key');
  },
};
