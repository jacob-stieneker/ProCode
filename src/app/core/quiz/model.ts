export const quizTopics = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'angular', name: 'Angular' },
  { id: 'full-stack', name: 'Full-stack' },
  { id: 'vocabulary', name: 'Developer vocabulary' },
  { id: 'git', name: 'Git' },
  { id: 'firebase', name: 'Firebase' },
] as const;
export type Topic = (typeof quizTopics)[number]['id'];
export interface Question {
  id: string;
  topic: Topic;
  prompt: string;
  choices: [string, string, string, string];
  correct: number;
  explanation: string;
  source: string;
}
// Authors list the correct choice first. Session creation shuffles option indices.
export type Entry = [
  id: string,
  prompt: string,
  choices: [string, string, string, string],
  explanation: string,
  source: string,
];
export const bank = (topic: Topic, entries: Entry[]): Question[] =>
  entries.map(([id, prompt, choices, explanation, source]) => ({
    id: `${topic}-${id}`,
    topic,
    prompt,
    choices,
    correct: 0,
    explanation,
    source,
  }));
