import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { isSafeBaseUrl } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const rateLimitResponse = checkRateLimit(req, 20, 60000); // 20 requests per minute
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const settingsStr = formData.get('settings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid file type. Only audio and video files are allowed.' }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) { // 25 MB max limit
      return NextResponse.json({ error: 'Audio file too large (Max 25MB)' }, { status: 400 });
    }
    if (!settingsStr) {
      return NextResponse.json({ error: 'Settings not provided' }, { status: 400 });
    }

    const settings = JSON.parse(settingsStr);

    if (settings.provider === 'openai' || settings.provider === 'local') {
      if (settings.provider === 'local' && !isSafeBaseUrl(settings.baseURL)) {
        return NextResponse.json({ error: 'Local endpoints are disabled by security policy' }, { status: 403 });
      }
      if (settings.provider === 'openai' && !settings.apiKey) {
        return NextResponse.json({ error: 'API key is missing for OpenAI STT' }, { status: 401 });
      }

      const openai = new OpenAI({ 
        apiKey: settings.apiKey || 'not-needed',
        baseURL: settings.provider === 'local' ? (settings.baseURL || 'http://localhost:1234/v1') : undefined
      });
      
      const audioFile = new File([file], 'audio.webm', { type: 'audio/webm' });
      
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: settings.model || 'whisper-1',
      });
      return NextResponse.json({ text: response.text });
      
    } else if (settings.provider === 'gemini') {
      if (!settings.apiKey) {
        return NextResponse.json({ error: 'API key is missing for Gemini STT' }, { status: 401 });
      }
      const genAI = new GoogleGenerativeAI(settings.apiKey);
      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      const model = genAI.getGenerativeModel({ model: settings.model || 'gemini-1.5-flash' });
      
      const response = await model.generateContent([
        {
          inlineData: {
            mimeType: file.type || 'audio/webm',
            data: base64Audio
          }
        },
        'Transcribe this audio exactly as spoken. Do not add any extra text, markdown, or commentary. Only output the transcribed text.'
      ]);

      return NextResponse.json({ text: response.response.text() });
    } else {
      return NextResponse.json({ error: `Unsupported STT provider: ${settings.provider}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error processing audio';
    console.error('Transcription error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
