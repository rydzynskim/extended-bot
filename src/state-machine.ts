import { askModel } from './inference';
import { executeTask, getExtension, waitForUserInput } from './helpers';
import {
  TEffect,
  TStateMachineEvents,
  TState,
  TMessage,
  TypedEventEmitter,
} from './types';

export async function effectRunner(
  effect: TEffect,
  emitter: TypedEventEmitter<TStateMachineEvents>
): Promise<void> {
  switch (effect.kind) {
    case 'requestModel': {
      // request the inference model
      const answer = await askModel(effect.prompt, effect.extension);

      emitter.emit(
        'message',
        { kind: 'modelResponse', response: answer },
        emitter
      );
      break;
    }
    case 'requestUser':
      {
        // prompt the user and wait for them to say something
        const prompt = await waitForUserInput(effect.request);

        emitter.emit(
          'message',
          { kind: 'userResponse', response: prompt },
          emitter
        );
      }
      break;
    case 'getExtension':
      {
        // get the available extension from the extension server
        const extension = await getExtension(effect.prompt);

        emitter.emit(
          'message',
          { kind: 'getExtensionResponse', response: extension },
          emitter
        );
      }
      break;
    case 'executeTask': {
      // tell the extension server to do something
      const result = await executeTask(effect.request);

      emitter.emit(
        'message',
        { kind: 'executeTaskResponse', response: result },
        emitter
      );
    }
  }
}

export function update(
  state: TState,
  message: TMessage
): { state: TState; effects: TEffect[] } {
  switch (state.kind) {
    case 'start':
      if (message.kind === 'userResponse') {
        return {
          state: {
            kind: 'waitingForExtension',
            prompt: message.response,
          },
          effects: [
            {
              kind: 'getExtension',
              prompt: message.response,
            },
          ],
        };
      } else {
        throw new Error(
          `Invalid message: ${message.kind} for state: ${state.kind}`
        );
      }
    case 'waitingForExtension':
      if (message.kind === 'getExtensionResponse') {
        return {
          state: { kind: 'waitingForModelResponse' },
          effects: [
            {
              kind: 'requestModel',
              prompt: state.prompt,
              extension: message.response,
            },
          ],
        };
      } else {
        throw new Error(
          `Invalid message: ${message.kind} for state: ${state.kind}`
        );
      }
    case 'waitingForTaskExecution': {
      if (message.kind === 'executeTaskResponse') {
        return {
          state: { kind: 'waitingForUserResponse' },
          effects: [{ kind: 'requestUser', request: message.response }],
        };
      } else {
        throw new Error(
          `Invalid message: ${message.kind} for state: ${state.kind}`
        );
      }
    }
    case 'waitingForModelResponse':
      if (message.kind === 'modelResponse') {
        switch (message.response.kind) {
          case 'execute':
            return {
              state: { kind: 'waitingForTaskExecution' },
              effects: [
                { kind: 'executeTask', request: message.response.data },
              ],
            };
          case 'respond':
            return {
              state: { kind: 'waitingForUserResponse' },
              effects: [
                { kind: 'requestUser', request: message.response.data },
              ],
            };
        }
      } else {
        throw new Error(
          `Invalid message: ${message.kind} for state: ${state.kind}`
        );
      }
    case 'waitingForUserResponse':
      if (message.kind === 'userResponse') {
        return {
          state: { kind: 'waitingForExtension', prompt: message.response },
          effects: [{ kind: 'getExtension', prompt: message.response }],
        };
      } else {
        throw new Error(
          `Invalid message: ${message.kind} for state: ${state.kind}`
        );
      }
  }
}
