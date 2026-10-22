import { downloadJson } from '../core/download';
import { Component, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { quizTopics } from '../core/quiz/model';
import { questions, questionById } from '../core/quiz/questions';
import {
  Attempt,
  QuizTopic,
  answered,
  createAttempt,
  finishAttempt,
  readQuizState,
  saveQuizState,
  score,
} from '../core/quiz/session';
@Component({
  selector: 'pc-quiz',
  imports: [FormsModule, DatePipe],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  private loaded = readQuizState();
  state = signal(this.loaded.data);
  warning = signal(this.loaded.warning);
  setup = signal(!this.loaded.data.active);
  review = signal<Attempt | null>(null);
  topic: QuizTopic = this.loaded.data.active?.topic ?? 'javascript';
  count: 10 | 20 = this.loaded.data.active?.count ?? 10;
  readonly topics = quizTopics;
  readonly bankSize = questions.length;
  readonly questionById = questionById;
  readonly score = score;
  readonly answered = answered;
  shown = computed(() => this.review() ?? this.state().active);
  item = computed(() => this.shown()?.items[this.shown()!.current]);
  question = computed(() => (this.item() ? questionById.get(this.item()!.id)! : null));
  @ViewChild('heading') heading?: ElementRef<HTMLElement>;
  label(topic: QuizTopic) {
    return topic === 'all' ? 'All topics' : quizTopics.find((t) => t.id === topic)!.name;
  }
  available() {
    return this.topic === 'all'
      ? questions.length
      : questions.filter((q) => q.topic === this.topic).length;
  }
  persist() {
    if (!saveQuizState(this.state()))
      this.warning.set(
        'Quiz storage is unavailable or full. Keep this tab open or export your quizzes.',
      );
  }
  focusHeading() {
    setTimeout(() => this.heading?.nativeElement.focus(), 0);
  }
  start() {
    const active = this.state().active;
    if (
      active &&
      !active.completedAt &&
      !window.confirm('Replace your unfinished quiz? Its answers will be discarded.')
    )
      return;
    this.state.update((s) => ({
      ...s,
      active: createAttempt(this.topic, Number(this.count) as 10 | 20),
    }));
    this.review.set(null);
    this.setup.set(false);
    this.persist();
    this.focusHeading();
  }
  resume() {
    this.review.set(null);
    this.setup.set(false);
    this.focusHeading();
  }
  topicsScreen() {
    this.setup.set(true);
    this.review.set(null);
    this.focusHeading();
  }
  answer(choice: number) {
    this.state.update((s) =>
      !s.active || s.active.completedAt
        ? s
        : {
            ...s,
            active: {
              ...s.active,
              items: s.active.items.map((item, i) =>
                i === s.active!.current ? { ...item, answer: choice } : item,
              ),
            },
          },
    );
    this.persist();
  }
  go(index: number) {
    const a = this.state().active;
    if (!a || index < 0 || index >= a.count || a.completedAt) return;
    this.state.update((s) => ({ ...s, active: { ...a, current: index } }));
    this.persist();
    this.focusHeading();
  }
  submit() {
    this.state.update(finishAttempt);
    this.persist();
    this.focusHeading();
  }
  openReview(attempt: Attempt) {
    this.review.set(attempt);
    this.setup.set(false);
    this.focusHeading();
  }
  export() {
    downloadJson(this.state(), 'procode-quizzes.json');
  }
}
