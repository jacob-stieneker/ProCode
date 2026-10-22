import { Injectable } from '@angular/core';
import { ExecutionAdapter, Language } from './exercises';
import type { Method, MethodResult } from './method-policy';
export interface Execution {
  outputs: { value?: unknown; error?: string }[];
  logs: string[];
  error?: string;
  method?: MethodResult;
}
@Injectable({ providedIn: 'root' })
export class Runner {
  private engine?: import('./execution-engine').ExecutionEngine;
  private loading?: Promise<import('./execution-engine').ExecutionEngine>;
  private revision = 0;
  cancel() {
    this.revision++;
    this.engine?.cancel();
  }
  async run(
    language: Language,
    source: string,
    name: string,
    inputs: unknown[][],
    adapter: ExecutionAdapter = 'json',
    method?: Method,
  ): Promise<Execution> {
    this.cancel();
    const revision = this.revision;
    const engine = await (this.loading ??= import('./execution-engine').then(
      (module) => new module.ExecutionEngine(),
    ));
    this.engine = engine;
    if (revision !== this.revision) return { outputs: [], logs: [], error: 'Run cancelled.' };
    return engine.run(language, source, name, inputs, adapter, method);
  }
}
