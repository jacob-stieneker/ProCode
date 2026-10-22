import { languageQuestions } from './languages';
import { frontendQuestions } from './frontend';
import { engineeringQuestions } from './engineering';
export const questions = [...languageQuestions, ...frontendQuestions, ...engineeringQuestions];
export const questionById = new Map(questions.map((question) => [question.id, question]));
