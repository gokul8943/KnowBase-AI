let memoryAccessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return memoryAccessToken;
};

export const setAccessToken = (token: string): void => {
  memoryAccessToken = token;
};

export const clearTokens = (): void => {
  memoryAccessToken = null;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};