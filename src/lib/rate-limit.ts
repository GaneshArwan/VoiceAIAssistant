import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export function checkRateLimit(req: Request, maxRequests: number, windowMs: number) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
  const now = Date.now();
  
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }
  
  if (record.count >= maxRequests) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }
  
  record.count++;
  return null;
}
