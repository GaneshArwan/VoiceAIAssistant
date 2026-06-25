import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { isSafeBaseUrl, validateProviderConfig, sanitizeError } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = 'You are a highly responsive, conversational Voice AI assistant. Keep responses very concise, engaging, and directly answer the user without fluff. Optimize for spoken output.';

export async function POST(req: Request) {
  try {
    const rateLimitResponse = checkRateLimit(req, 20, 60000); // 20 requests per minute
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { messages, settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings not provided' }, { status: 400 });
    }

    const settingsVal = validateProviderConfig(settings, ['gemini', 'openai', 'anthropic', 'local'], false);
    if (!settingsVal.isValid) {
      return NextResponse.json({ error: settingsVal.error }, { status: 400 });
    }

    if (settings.provider !== 'local') {
      if (!settings.apiKey || !settings.apiKey.trim()) {
        return NextResponse.json({ error: `API key is missing for ${settings.provider} LLM` }, { status: 401 });
      }
    } else {
      if (settings.baseURL && !isSafeBaseUrl(settings.baseURL)) {
        return NextResponse.json({ error: 'Local endpoints are disabled by security policy' }, { status: 403 });
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }
    if (messages.length > 50) {
      return NextResponse.json({ error: 'Too many messages in history' }, { status: 400 });
    }
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return NextResponse.json({ error: 'Invalid message object' }, { status: 400 });
      }
      if (typeof msg.role !== 'string' || !['user', 'assistant', 'system'].includes(msg.role)) {
        return NextResponse.json({ error: 'Invalid message role' }, { status: 400 });
      }
      if (typeof msg.content !== 'string') {
        return NextResponse.json({ error: 'Message content must be a string' }, { status: 400 });
      }
      if (msg.content.length > 4000) {
        return NextResponse.json({ error: 'Message content too long' }, { status: 400 });
      }
    }

    if (settings.provider === 'openai' || settings.provider === 'local') {
      const openai = new OpenAI({ 
        apiKey: settings.apiKey || 'not-needed',
        baseURL: settings.provider === 'local' ? (settings.baseURL || 'http://localhost:1234/v1') : undefined
      });
      const response = await openai.chat.completions.create({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 150,
        temperature: 0.7,
      });
      return NextResponse.json({
        text: response.choices[0].message.content,
        role: 'assistant'
      });

    } else if (settings.provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(settings.apiKey);
      const model = genAI.getGenerativeModel({ 
          model: settings.model || 'gemini-1.5-flash',
          systemInstruction: SYSTEM_PROMPT
      });

      const rawHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
      }));

      // Gemini requires the history to start with a 'user' message
      const firstUserIndex = rawHistory.findIndex(m => m.role === 'user');
      const history = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

      const lastMessage = messages[messages.length - 1].content;

      const chat = model.startChat({
          history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
      });
      const result = await chat.sendMessage(lastMessage);

      return NextResponse.json({
        text: result.response.text(),
        role: 'assistant'
      });

    } else if (settings.provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: settings.apiKey });
      
      const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.content
      }));

      const msg = await anthropic.messages.create({
        model: settings.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: formattedMessages
      });
      
      // @ts-expect-error - Anthropic types are sometimes inconsistent
      const textResponse = msg.content[0]?.text || '';

      return NextResponse.json({
        text: textResponse,
        role: 'assistant'
      });
      
    } else {
      return NextResponse.json({ error: `Unsupported LLM provider: ${settings.provider}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error generating response';
    const sanitizedMsg = sanitizeError(errorMessage);
    console.error('Chat error:', sanitizedMsg);
    return NextResponse.json({ error: sanitizedMsg }, { status: 500 });
  }
}
