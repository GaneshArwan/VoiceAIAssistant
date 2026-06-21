# 🎙️ VoiceAI Assistant

> A high-performance, real-time voice-interactive application engineered for fluid, natural conversation.

**[🔴 Live Demo: Try VoiceAI Assistant Here](https://voice-ai-assistant-theta.vercel.app/)**
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

## Why This Exists

Traditional voice assistants often suffer from high latency, making conversations feel robotic and disjointed. VoiceAI Assistant solves this by implementing an ultra-low latency pipeline (<500ms target) combined with a Bring Your Own Key (BYOK) architecture. It allows developers and users to seamlessly connect multiple AI providers for perception, intelligence, and synthesis without compromising on speed or privacy.

## ✨ Key Features

*   **⚡ Ultra-Low Latency:** Optimized pipeline designed to keep response times under 500ms for a natural conversational flow.
*   **🔑 Bring Your Own Key (BYOK):** No server-side key storage. Your API keys stay in your browser's `localStorage` and are only used for the duration of the request.
*   **🌐 Multi-Provider Support:** Mix and match providers for different stages of the pipeline (e.g., OpenAI for STT, Anthropic for LLM, ElevenLabs for TTS).
*   **🟢 Local AI Ready:** Support for local providers like Ollama, LM Studio, or custom Whisper endpoints via OpenAI-compatible API routes.
*   **💎 Emerald Aesthetic:** A sleek, glossy UI with fluid animations, glassmorphism, and real-time waveform visualizations.
*   **🎙️ Smart Interaction:** Push-to-talk interface with automatic interruption handling (barge-in support).

## 🚀 Quick Start

Get your VoiceAI Assistant up and running in under 2 minutes.

### Prerequisites

*   Node.js 20.x or later
*   npm or yarn
*   API keys for your preferred LLM, STT, and TTS providers

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GaneshArwan/VoiceAIAssistant.git
   cd VoiceAIAssistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 1. Configuration (The "System Core")
Upon your first visit, the **System Core** settings dialog will prompt you to configure your API providers. You must set up at least one provider for each of the three pipeline stages:

*   **Intelligence (LLM):** The reasoning engine (e.g., GPT-5.2 Mini, Claude).
*   **Perception (STT):** Transcribes your voice (e.g., Whisper).
*   **Synthesis (TTS):** Gives the assistant a voice (e.g., OpenAI TTS, ElevenLabs).

### 2. How It Works: The 3-Stage Pipeline

VoiceAI Assistant breaks down the interaction into three seamless, highly optimized stages:

1.  **Listening:** Press and hold the microphone button to record your voice. Your browser captures high-efficiency WebM audio.
2.  **Thinking:** Once released, the system sends the audio blob to the Perception API. The transcribed text is immediately forwarded along with the last 10 conversation turns to the Intelligence API.
3.  **Speaking:** The generated response is instantly routed to the Synthesis API, which streams an MP3 audio buffer back to the browser for immediate, auto-played response.

### 3. Interruption & Barge-In
If the assistant is speaking and you wish to interrupt, simply click the microphone button again. The Web Audio API will instantly terminate the active playback, allowing you to start a new recording immediately.

## ⚙️ Supported Providers

| Stage | Supported Providers |
| :--- | :--- |
| **Intelligence (LLM)** | Google Gemini, OpenAI (GPT-4o/5.2), Anthropic Claude, Local (Ollama/LM Studio) |
| **Perception (STT)** | Google Gemini, OpenAI Whisper, Local (Whisper-compatible) |
| **Synthesis (TTS)** | Google Translate (Free), Google Gemini, OpenAI TTS, ElevenLabs, Local |

## 🛠️ Tech Stack

*   **Framework:** Next.js 15 (App Router, Server Actions)
*   **Styling:** Tailwind CSS 4, custom Glassmorphism, Emerald Aesthetic
*   **Animations:** Framer Motion, CSS Keyframes
*   **Icons:** Lucide React

## 🤝 Contributing

We love contributions! If you have a feature request, bug report, or want to improve the codebase, please feel free to submit a Pull Request. 

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See the [MIT License](LICENSE) file for more information.
