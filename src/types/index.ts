export interface User {
  email: string;
  token: string;
}

export interface Transcription {
  id: number;
  originalFilename: string;
  duration: number;
  text: string;
  createdAt: string;
}

export interface TranscriptionPreview {
  id: number;
  originalFilename: string;
  duration: number;
  preview: string;
  createdAt: string;
}
