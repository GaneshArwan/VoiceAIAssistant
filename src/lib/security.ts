export function isSafeBaseUrl(url?: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname;
    
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isAwsMetadata = hostname === '169.254.169.254';
    const isPrivateIP = /^10\./.test(hostname) || 
                        /^192\.168\./.test(hostname) || 
                        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocalhost || isAwsMetadata || isPrivateIP) {
        return process.env.ALLOW_LOCAL_ENDPOINTS === 'true';
    }
    
    return true;
  } catch {
    return false;
  }
}

export function validateProviderConfig(
  config: any,
  validProviders: string[],
  requireApiKey = false
): { isValid: boolean; error?: string } {
  if (!config || typeof config !== 'object') {
    return { isValid: false, error: 'Config must be an object' };
  }
  if (typeof config.provider !== 'string' || !validProviders.includes(config.provider)) {
    return { isValid: false, error: `Invalid provider: ${config.provider}` };
  }
  if (requireApiKey && config.provider !== 'local' && config.provider !== 'google') {
    if (typeof config.apiKey !== 'string' || !config.apiKey.trim()) {
      return { isValid: false, error: `API key is required for provider: ${config.provider}` };
    }
  }
  if (config.apiKey && typeof config.apiKey !== 'string') {
    return { isValid: false, error: 'API key must be a string' };
  }
  if (config.model && typeof config.model !== 'string') {
    return { isValid: false, error: 'Model ID must be a string' };
  }
  if (config.baseURL) {
    if (typeof config.baseURL !== 'string') {
      return { isValid: false, error: 'Base URL must be a string' };
    }
    if (!isSafeBaseUrl(config.baseURL)) {
      return { isValid: false, error: 'Base URL violates security policy' };
    }
  }
  if (config.projectId && typeof config.projectId !== 'string') {
    return { isValid: false, error: 'Project ID must be a string' };
  }
  return { isValid: true };
}

export function sanitizeError(err: unknown): string {
  if (!err) return 'Unknown error';
  let message = err instanceof Error ? err.message : String(err);
  
  // Mask OpenAI API keys: sk-proj-... or sk-...
  message = message.replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]');
  // Mask Gemini API keys: AIzaSy...
  message = message.replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, '[REDACTED_API_KEY]');
  // Mask generic auth tokens / keys
  message = message.replace(/(?<=key[=:\s"'])[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_API_KEY]');
  
  return message;
}

