export type AspectRatio = '16:9' | '9:16';
export type VideoDuration = '3s' | '5s' | '10s' | '15s';
export type VideoResolution = '360p' | '720p' | '1080p' | '4k';
export type GenerationMode = 'text-to-video' | 'image-to-video';

export interface StylePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  promptModifier: string;
}

export interface CameraMotionPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  promptModifier: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  mode: GenerationMode;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  style?: string;
  cameraMotion?: string;
  sourceImage?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  category: 'cinematic' | 'nature' | 'scifi' | 'animation';
  videoUrl: string;
  posterUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  duration: string;
  resolution: string;
  style: string;
  camera: string;
}
