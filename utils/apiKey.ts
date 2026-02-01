
import { apiKeyManager } from '../services/apiKeyManager';

export const clearLegacyKeys = () => {
    apiKeyManager.clearLegacyKeys();
};

export const setApiKey = (key: string) => {
    apiKeyManager.save(key);
};

export const getApiKey = (): string | null => {
    return apiKeyManager.get();
};

export const hasApiKey = (): boolean => {
    return !!getApiKey();
};

export const clearApiKey = () => {
    apiKeyManager.clear();
};

export const setSessionOnly = (enabled: boolean) => {
    apiKeyManager.setSessionOnly(enabled);
};

export const isSessionOnly = (): boolean => {
    return apiKeyManager.isSessionOnly();
};

export const enableSessionOnlyAutoClear = () => {
    apiKeyManager.enableSessionOnlyAutoClear();
};
