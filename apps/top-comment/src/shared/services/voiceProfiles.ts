import type { TTSVoiceConfig, TTSAudioConfig } from "./ttsService";

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  voice: TTSVoiceConfig;
  audioConfig: TTSAudioConfig;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "smooth-q",
    name: "Smooth Q",
    description: "The cool, deep, conversational Studio voice.",
    voice: {
      languageCode: "en-US",
      name: "en-US-Studio-Q",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 0,
      speakingRate: 1.0,
      volumeGainDb: 0,
    },
  },
  {
    id: "crystal",
    name: "Crystal",
    description: "Professional and clear female host.",
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-F",
      ssmlGender: "FEMALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 0,
      speakingRate: 1.0,
      volumeGainDb: 0,
    },
  },
  {
    id: "radio-d",
    name: "Radio Dan",
    description: "Classic deep-voiced radio announcer.",
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-D",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: -2.0,
      speakingRate: 1.0,
      volumeGainDb: 0,
    },
  },
  {
    id: "hype-a",
    name: "Hype Man",
    description: "High energy, slightly fast-paced announcer.",
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-A",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 2.0,
      speakingRate: 1.1,
      volumeGainDb: 0,
    },
  },
  {
    id: "deep-creep",
    name: "Deep Creep",
    description: "The one you said sounds like a creep.",
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-D",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: -12.0,
      speakingRate: 0.85,
      volumeGainDb: 0,
    },
  },
];

export const DEFAULT_VOICE_PROFILE = VOICE_PROFILES[0];
