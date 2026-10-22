import type { Difficulty } from '../exercises';
export const firebaseExerciseInfo = [
  { id: 'fb-setup', title: 'Connect a Firebase Workspace', difficulty: 'junior', version: 1 },
  { id: 'fb-init', title: 'Initialize Hosting and Firestore', difficulty: 'junior', version: 1 },
  { id: 'fb-emulators', title: 'Start Local Auth and Firestore', difficulty: 'junior', version: 1 },
  { id: 'fb-hosting', title: 'Deploy Only Hosting to Staging', difficulty: 'skilled', version: 1 },
  {
    id: 'fb-preview',
    title: 'Create a Hosting Preview Channel',
    difficulty: 'skilled',
    version: 1,
  },
  { id: 'fb-data', title: 'Reuse Emulator Seed Data', difficulty: 'skilled', version: 1 },
  { id: 'fb-ci', title: 'Run Rules Tests in Emulators', difficulty: 'senior', version: 1 },
  {
    id: 'fb-rules',
    title: 'Release Firestore Rules and Indexes',
    difficulty: 'senior',
    version: 1,
  },
  { id: 'fb-target', title: 'Deploy a Named Hosting Target', difficulty: 'senior', version: 1 },
] satisfies FirebaseInfo[];
export interface FirebaseInfo {
  id: string;
  title: string;
  difficulty: Difficulty;
  version: number;
}
export const firebaseKey = (e: FirebaseInfo) => `${e.id}:v${e.version}`;
export interface FirebaseState {
  authenticated: boolean;
  listed: boolean;
  project: string;
  configured: string[];
  emulators: {
    services: string[];
    project: string;
    importPath: string;
    exportPath: string;
    running: boolean;
  } | null;
  deploys: { project: string; services: string[] }[];
  previews: { project: string; channel: string; expires: string }[];
  targets: Record<string, string>;
  tests: { project: string; services: string[]; script: string }[];
}
export interface FirebaseCheck {
  name: string;
  hint: string;
  test: (state: FirebaseState) => boolean;
}
export interface FirebaseExercise extends FirebaseInfo {
  description: string;
  requirements: string[];
  starter: string;
  hints: string[];
  explanation: string;
  initial: FirebaseState;
  checks: FirebaseCheck[];
}
export interface FirebaseResult {
  name: string;
  hint: string;
  pass: boolean;
}
export const freshFirebaseEnvironment = (): FirebaseState => ({
  authenticated: false,
  listed: false,
  project: '',
  configured: [],
  emulators: null,
  deploys: [],
  previews: [],
  targets: {},
  tests: [],
});
