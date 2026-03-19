import { EventEmitter } from 'events';

export const sseEmitter = new EventEmitter();
sseEmitter.setMaxListeners(100);

export function sseEmit(caseId, payload) {
  sseEmitter.emit(caseId, payload);
}
