import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export function checkRateLimit(req: Request, maxRequests: number, windowMs: number) {
  const rawIp = req.headers.get('x-forwarded-for') || 'unknown-ip';
  // Parse first IP from the proxy chain (standard security practice)
  const ip = rawIp.split(',')[0].trim();
  const now = Date.now();
  
  // Periodic cleanup if the map gets too large to prevent memory leak (ponytail: size ceiling 2000)
  if (rateLimitMap.size > 2000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    if (record) {
      rateLimitMap.delete(ip);
    }
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }
  
  if (record.count >= maxRequests) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }
  
  record.count++;
  return null;
}

