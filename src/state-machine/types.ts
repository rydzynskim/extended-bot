import EventEmitter from 'events';
import { TPromptMessages } from '../model/types.js';

// the states of our state machine
export type TState =
  | { kind: 'start'; conversation: TPromptMessages[] }
  | {
      kind: 'waitingForTaskExecution';
      conversation: TPromptMessages[];
      id: string;
    }
  | { kind: 'waitingForModelResponse'; conversation: TPromptMessages[] }
  | {
      kind: 'waitingForExecutionVerification';
      refMap: Record<string, (...args: any[]) => any>;
      request: IExecutePayload;
      conversation: TPromptMessages[];
    }
  | { kind: 'waitingForUserResponse'; conversation: TPromptMessages[] }
  | { kind: 'done' };

// the parameters needed to execute a task
export interface IExecutePayload {
  method: string;
  args: Record<string, any>;
  id: string;
}

// the kinds of effects our state machine can produce
export type TEffect =
  | { kind: 'requestModel'; conversation: TPromptMessages[] }
  | { kind: 'requestUser'; request: string; prefix: string }
  | {
      kind: 'executeTask';
      request: IExecutePayload;
      refMap: Record<string, (...args: any[]) => any>;
    }
  | {
      kind: 'askVerification';
      request: IExecutePayload;
    }
  | {
      kind: 'clearConversationHistory';
      conversation: TPromptMessages[];
    }
  | { kind: 'showPromptTokenCount'; conversation: TPromptMessages[] }
  | { kind: 'quit' };

// the kinds of responses we expect from the model
export type TModelResponse =
  | {
      kind: 'execute';
      data: IExecutePayload;
    }
  | { kind: 'respond'; data: string };

// the kinds of messages in our state machine
export type TMessage =
  | {
      kind: 'modelResponse';
      response: TModelResponse;
      refMap: Record<string, (...args: any[]) => any>;
    }
  | { kind: 'userResponse'; response: string }
  | { kind: 'executeTaskResponse'; response: string }
  | {
      kind: 'verification';
      response: 'y' | 'n';
    };

// the types of our events
export type TStateMachineEvents = {
  message: [message: TMessage];
  effect: [effect: TEffect];
};

// some fancy typescript to get type saftey on our events
// source: https://blog.makerx.com.au/a-type-safe-event-emitter-in-node-js/
export class TypedEventEmitter<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();

  emit<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    ...eventArg: TEvents[TEventName]
  ) {
    this.emitter.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.on(eventName, handler as any);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.off(eventName, handler as any);
  }
}

export const emitter = new TypedEventEmitter<TStateMachineEvents>();
