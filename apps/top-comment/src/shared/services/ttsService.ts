/**
 * Text-to-Speech Service
 * 
 * Supports two synthesis methods:
 * 1. Web Speech API (browser-native, free, works immediately)
 * 2. Google Cloud TTS REST API (premium quality, requires API key)
 */

export type TTSVoiceConfig = {
  languageCode: string;
  name: string;
  ssmlGender: "NEUTRAL" | "MALE" | "FEMALE";
};

export type TTSAudioConfig = {
  audioEncoding: "MP3" | "OGG_OPUS" | "LINEAR16";
  pitch: number;
  speakingRate: number;
  volumeGainDb: number;
};

export type TTSOptions = {
  voice?: Partial<TTSVoiceConfig>;
  audioConfig?: Partial<TTSAudioConfig>;
  preferWebSpeech?: boolean; // Use browser API even if Cloud API key is available
};

export type TTSMethod = "web-speech" | "google-cloud" | "none";

type TTSResponse = {
  audioContent?: string;
  error?: {
    message?: string;
  };
};

const defaultVoice: TTSVoiceConfig = {
  languageCode: "en-US",
  name: "en-US-Neural2-D",
  ssmlGender: "MALE",
};

const defaultAudioConfig: TTSAudioConfig = {
  audioEncoding: "MP3",
  pitch: -12.0,
  speakingRate: 0.85,
  volumeGainDb: 0,
};

const apiKey = import.meta.env.VITE_TTS_API_KEY as string | undefined;

export class TTSService {
  private readonly audioCache = new Map<string, string>();
  private readonly webSpeechSupported: boolean;

  constructor() {
    this.webSpeechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Get the available TTS method
   */
  getAvailableMethod(): TTSMethod {
    if (apiKey) return "google-cloud";
    if (this.webSpeechSupported) return "web-speech";
    return "none";
  }

  /**
   * Check if TTS is available
   */
  isAvailable(): boolean {
    return this.getAvailableMethod() !== "none";
  }

  /**
   * Synthesize speech using Web Speech API (browser-native)
   */
  private synthesizeWebSpeech(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.webSpeechSupported) {
        reject(new Error("Web Speech API not supported in this browser."));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map options to Web Speech API
      utterance.lang = options.voice?.languageCode ?? "en-US";
      utterance.pitch = options.audioConfig?.pitch !== undefined 
        ? Math.max(0, Math.min(2, 1 + options.audioConfig.pitch / 10))
        : 1;
      utterance.rate = options.audioConfig?.speakingRate ?? 1.0;
      utterance.volume = options.audioConfig?.volumeGainDb !== undefined
        ? Math.max(0, Math.min(1, 1 + options.audioConfig.volumeGainDb / 20))
        : 1;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith(utterance.lang) && 
               (options.voice?.ssmlGender === "FEMALE" ? v.name.toLowerCase().includes("female") : 
                options.voice?.ssmlGender === "MALE" ? v.name.toLowerCase().includes("male") : true)
      ) ?? voices.find((v) => v.lang.startsWith(utterance.lang));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis failed: ${event.error}`));

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Synthesize speech using Google Cloud TTS REST API
   */
  private async synthesizeGoogleCloud(text: string, options: TTSOptions = {}): Promise<string> {
    if (!apiKey) {
      throw new Error("Missing VITE_TTS_API_KEY for Google Cloud TTS.");
    }

    const requestPayload = {
      input: { text },
      voice: { ...defaultVoice, ...options.voice },
      audioConfig: { ...defaultAudioConfig, ...options.audioConfig },
    };

    const cacheKey = JSON.stringify(requestPayload);
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Cloud TTS request failed: ${errorText}`);
    }

    const data = (await response.json()) as TTSResponse;
    if (!data.audioContent) {
      throw new Error(data.error?.message ?? "TTS response missing audio content.");
    }

    this.audioCache.set(cacheKey, data.audioContent);
    return data.audioContent;
  }

  /**
   * Synthesize speech using the best available method
   * Returns base64 audio data for Google Cloud, undefined for Web Speech
   */
  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string | undefined> {
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("TTS text is empty.");
    }

    // Determine which method to use
    const useWebSpeech = options.preferWebSpeech || !apiKey;

    if (useWebSpeech && this.webSpeechSupported) {
      await this.synthesizeWebSpeech(trimmedText, options);
      return undefined; // Web Speech API doesn't return audio data
    }

    // Fall back to Google Cloud TTS
    return await this.synthesizeGoogleCloud(trimmedText, options);
  }

  /**
   * Cancel any ongoing Web Speech synthesis
   */
  cancel(): void {
    if (this.webSpeechSupported) {
      window.speechSynthesis.cancel();
    }
  }

  clearCache(): void {
    this.audioCache.clear();
  }

  getCacheSize(): number {
    return this.audioCache.size;
  }
}

export const ttsService = new TTSService();
