export function isSafeBaseUrl(url?: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
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
