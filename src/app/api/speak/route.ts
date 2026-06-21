import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';
import OpenAI from 'openai';
import { isSafeBaseUrl } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const rateLimitResponse = checkRateLimit(req, 20, 60000); // 20 requests per minute
    if (rateLimitResponse) return rateLimitResponse;

    const { text, settings } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 });
    }
    if (!settings) {
      return NextResponse.json({ error: 'Settings not provided' }, { status: 400 });
    }

    if (settings.provider === 'google') {
      const results = await googleTTS.getAllAudioBase64(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        splitPunct: ',.?'
      });

      const buffers = results.map(result => Buffer.from(result.base64, 'base64'));
      const finalBuffer = Buffer.concat(buffers);

      return new NextResponse(finalBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });

    } else if (settings.provider === 'gemini') {
      if (!settings.apiKey) {
        return NextResponse.json({ error: 'API key is missing for Gemini TTS' }, { status: 401 });
      }

      // Use the Cloud Text-to-Speech REST API which supports Gemini-TTS models
      const modelName = settings.model || 'gemini-3.1-flash-tts-preview';
      const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-user-project': settings.projectId || '',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'Kore', // Default Gemini Voice
            modelName: modelName
          },
          audioConfig: {
            audioEncoding: 'MP3'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini TTS API Error:', errorData);
        throw new Error(errorData.error?.message || `Gemini TTS API error: ${response.status}`);
      }

      const data = await response.json();
      const audioBuffer = Buffer.from(data.audioContent, 'base64');

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });

    } else if (settings.provider === 'openai' || settings.provider === 'local') {
      if (settings.provider === 'local' && !isSafeBaseUrl(settings.baseURL)) {
        return NextResponse.json({ error: 'Local endpoints are disabled by security policy' }, { status: 403 });
      }
      if (settings.provider === 'openai' && !settings.apiKey) {
        return NextResponse.json({ error: 'API key is missing for OpenAI TTS' }, { status: 401 });
      }

      const openai = new OpenAI({ 
        apiKey: settings.apiKey || 'not-needed',
        baseURL: settings.provider === 'local' ? (settings.baseURL || 'http://localhost:1234/v1') : undefined
      });
      
      const mp3 = await openai.audio.speech.create({
        model: settings.model || 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'mp3',
      });

      return new NextResponse(mp3.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });

    } else if (settings.provider === 'elevenlabs') {
      if (!settings.apiKey) {
        return NextResponse.json({ error: 'API key is missing for ElevenLabs' }, { status: 401 });
      }

      const voiceId = settings.model || '21m00Tcm4TlvDq8ikWAM'; 
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': settings.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'ElevenLabs API error');
      }

      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });

    } else {
       return NextResponse.json({ error: `Unsupported TTS provider: ${settings.provider}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error generating audio';
    console.error('TTS error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
