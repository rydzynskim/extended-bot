import EventEmitter from 'events';

// the states of our state machine
export type TState =
  | { kind: 'start' }
  | { kind: 'waitingForExtension'; prompt: string }
  | { kind: 'waitingForTaskExecution' }
  | { kind: 'waitingForModelResponse' }
  | { kind: 'waitingForUserResponse' };

// the parameters needed to execute a task
export interface IExecutePayload {
  extension: string;
  endpoint: string;
  args: Record<string, any>;
}

// the kinds of effects our state machine can produce
export type TEffect =
  | { kind: 'requestModel'; prompt: string; extension: string }
  | { kind: 'requestUser'; request: string }
  | { kind: 'getExtension'; prompt: string }
  | { kind: 'executeTask'; request: IExecutePayload };

// the kinds of responses we expect from the model
export type TModelResponse =
  | { kind: 'execute'; data: IExecutePayload }
  | { kind: 'respond'; data: string };

// the kinds of messages in our state machine
export type TMessage =
  | { kind: 'modelResponse'; response: TModelResponse }
  | { kind: 'userResponse'; response: string }
  | { kind: 'getExtensionResponse'; response: string }
  | { kind: 'executeTaskResponse'; response: string };

// the types of our events
export type TStateMachineEvents = {
  message: [message: TMessage, emitter: TypedEventEmitter<TStateMachineEvents>];
  effect: [effect: TEffect, emitter: TypedEventEmitter<TStateMachineEvents>];
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
