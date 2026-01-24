
const API_KEY_STORAGE = 'fotograf_user_api_key_v1';

export const clearLegacyKeys = () => {
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('artifex_user_api_key');
};

export const setApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
};

export const getApiKey = (): string | null => {
    const stored = localStorage.getItem(API_KEY_STORAGE);
    if (!stored) return null;
    return stored.trim() || null;
};

export const hasApiKey = (): boolean => {
    return !!getApiKey();
};

export const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
};
