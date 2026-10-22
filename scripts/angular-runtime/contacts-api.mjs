import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// Each Angular application receives an independent simulated server.
export class PracticeContactsApi {
  records = [
    { id: 1, name: 'Ada', email: 'ada@example.com', version: 1 },
    { id: 2, name: 'Grace', email: 'grace@example.com', version: 1 },
  ];
  nextId = 3;
  failure = null;
  failNext(operation) {
    this.failure = operation;
  }
  request(operation, work) {
    return new Observable((subscriber) => {
      const timer = setTimeout(() => {
        try {
          if (this.failure === operation) {
            this.failure = null;
            throw Object.assign(new Error('Request failed.'), { code: 503 });
          }
          subscriber.next(structuredClone(work()));
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      }, 160);
      return () => clearTimeout(timer);
    });
  }
  list() {
    return this.request('list', () => this.records);
  }
  fields(data) {
    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const email = typeof data?.email === 'string' ? data.email.trim() : '';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw Object.assign(new Error('Invalid contact.'), { code: 400 });
    return { name, email };
  }
  create(data) {
    return this.request('create', () => {
      const record = { ...this.fields(data), id: this.nextId++, version: 1 };
      this.records.push(record);
      return record;
    });
  }
  update(id, data, expectedVersion) {
    return this.request('update', () => {
      const index = this.records.findIndex((record) => record.id === id);
      if (index < 0) throw Object.assign(new Error('Contact not found.'), { code: 404 });
      const current = this.records[index];
      if (expectedVersion !== undefined && expectedVersion !== current.version)
        throw Object.assign(new Error('Contact changed elsewhere.'), { code: 409 });
      const next = { ...current, ...this.fields(data), version: current.version + 1 };
      this.records[index] = next;
      return next;
    });
  }
  delete(id, expectedVersion) {
    return this.request('delete', () => {
      const current = this.records.find((record) => record.id === id);
      if (!current) throw Object.assign(new Error('Contact not found.'), { code: 404 });
      if (expectedVersion !== undefined && expectedVersion !== current.version)
        throw Object.assign(new Error('Contact changed elsewhere.'), { code: 409 });
      this.records = this.records.filter((record) => record.id !== id);
      return { id };
    });
  }
  changeElsewhere(id) {
    const record = this.records.find((record) => record.id === id);
    if (record) {
      record.name = 'Ada Remote';
      record.version++;
    }
  }
}
Injectable({ providedIn: 'root' })(PracticeContactsApi);
