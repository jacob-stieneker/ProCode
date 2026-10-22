import type { Difficulty } from '../exercises';
export type WebTopic = 'html' | 'css';
export interface WebInfo {
  id: string;
  title: string;
  topic: WebTopic;
  difficulty: Difficulty;
  version: number;
}
export const webExerciseInfo: WebInfo[] = [
  {
    id: 'html-profile',
    title: 'Semantic Profile',
    topic: 'html',
    difficulty: 'junior',
    version: 1,
  },
  { id: 'html-contact', title: 'Contact Form', topic: 'html', difficulty: 'junior', version: 1 },
  {
    id: 'html-table',
    title: 'Accessible Data Table',
    topic: 'html',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'html-signup',
    title: 'Grouped Registration Form',
    topic: 'html',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'html-document',
    title: 'Accessible Document Navigation',
    topic: 'html',
    difficulty: 'senior',
    version: 1,
  },
  {
    id: 'html-disclosure',
    title: 'Native FAQ and Figure',
    topic: 'html',
    difficulty: 'senior',
    version: 1,
  },
  { id: 'css-card', title: 'Card Box Model', topic: 'css', difficulty: 'junior', version: 1 },
  { id: 'css-buttons', title: 'Button States', topic: 'css', difficulty: 'junior', version: 1 },
  {
    id: 'css-grid',
    title: 'Responsive Card Layout',
    topic: 'css',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'css-navigation',
    title: 'Responsive Navigation',
    topic: 'css',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'css-dashboard',
    title: 'Adaptive Dashboard',
    topic: 'css',
    difficulty: 'senior',
    version: 1,
  },
  {
    id: 'css-content',
    title: 'Resilient Content Layout',
    topic: 'css',
    difficulty: 'senior',
    version: 1,
  },
  {
    id: 'html-search',
    title: 'Accessible Search Form',
    topic: 'html',
    difficulty: 'junior',
    version: 1,
  },
  {
    id: 'html-checkout',
    title: 'Shipping Form Constraints',
    topic: 'html',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'html-errors',
    title: 'Accessible Form Error Summary',
    topic: 'html',
    difficulty: 'senior',
    version: 1,
  },
  {
    id: 'css-center',
    title: 'Center an Empty State',
    topic: 'css',
    difficulty: 'junior',
    version: 1,
  },
  {
    id: 'css-sticky',
    title: 'Sticky Results Header',
    topic: 'css',
    difficulty: 'skilled',
    version: 1,
  },
  {
    id: 'css-form-layout',
    title: 'Resilient Settings Form',
    topic: 'css',
    difficulty: 'senior',
    version: 1,
  },
];
export interface WebCheck {
  name: string;
  hint: string;
  width: 360 | 960;
  test: (document: Document) => boolean;
}
export interface WebExercise extends WebInfo {
  description: string;
  requirements: string[];
  starter: string;
  markup?: string;
  hints: string[];
  explanation: string;
  checks: WebCheck[];
}
export const webKey = (info: WebInfo) => `${info.id}:v${info.version}`;
