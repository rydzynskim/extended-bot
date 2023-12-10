import { effectRunner, update } from './state-machine';
import {
  TMessage,
  TState,
  TStateMachineEvents,
  TypedEventEmitter,
} from './types';
import { waitForUserInput } from './helpers';

async function main(): Promise<void> {
  // setup our message handler
  let state: TState = { kind: 'start' };
  function messageHandler(
    message: TMessage,
    emitter: TypedEventEmitter<TStateMachineEvents>
  ): void {
    const result = update(state, message);
    for (const effect of result.effects) {
      emitter.emit('effect', effect, emitter);
    }
    state = result.state;
  }

  // create event emitter instance and attach listeners
  const emitter = new TypedEventEmitter<TStateMachineEvents>();
  emitter.on('message', messageHandler);
  emitter.on('effect', effectRunner);

  // wait for user prompt and start the state machine
  const initialPrompt = await waitForUserInput(
    'Hi, welcome to the extend chatbot. How can I help you today?'
  );
  messageHandler({ kind: 'userResponse', response: initialPrompt }, emitter);
}

main();

// TODO:
// - make the output of the chatbot more reliable and the parsing better (maybe do retries)
// - add full conversation to thre model prompt
// - figure out how much of the conversation to trim in model request
// - where to input preprompt within that conversation
// - when to request a new extension, we don't want to do this if the model is asking clarification and the user is responding
