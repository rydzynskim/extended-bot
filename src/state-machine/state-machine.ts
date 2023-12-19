import { TTool, askModel, getAllTools } from '../model';
import {
  startTaskExecutionDisplay,
  stopTaskExecutionDisplay,
  waitForUserInput,
} from '../helpers';
import {
  TEffect,
  TStateMachineEvents,
  TState,
  TMessage,
  TypedEventEmitter,
} from './types';

async function effectRunner(
  effect: TEffect,
  emitter: TypedEventEmitter<TStateMachineEvents>
): Promise<void> {
  switch (effect.kind) {
    case 'requestModel':
      {
        // get all the available tools
        const toolInformation = getAllTools();
        const refMap: Record<string, (...args: any[]) => any> = {};
        const tools: TTool[] = [];
        Object.values(toolInformation).forEach((entry) => {
          refMap[entry.tool.function.name] = entry.ref;
          tools.push(entry.tool);
        });

        // request the inference model
        const answer = await askModel(effect.prompt, tools, 0);

        emitter.emit(
          'message',
          { kind: 'modelResponse', response: answer, refMap },
          emitter
        );
      }
      break;
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
    case 'executeTask':
      {
        // run the task
        const interval = startTaskExecutionDisplay(effect.request.method);
        const result = await effect.refMap[effect.request.method](
          effect.request.args
        );
        stopTaskExecutionDisplay(interval);

        emitter.emit(
          'message',
          { kind: 'executeTaskResponse', response: result },
          emitter
        );
      }
      break;
    case 'askVerification':
      {
        // ask the user if they would like to perform the task
        const question = `Would you like the model to call ${
          effect.request.method
        } with ${JSON.stringify(effect.request.args)}? [y|n]`;
        const response = (await waitForUserInput(question)) as 'y' | 'n';

        emitter.emit(
          'message',
          {
            kind: 'verification',
            response,
            request: effect.request,
            refMap: effect.refMap,
          },
          emitter
        );
      }
      break;
    case 'quit':
    default:
      process.exit(0);
  }
}

function update(
  state: TState,
  message: TMessage
): { state: TState; effects: TEffect[] } {
  switch (state.kind) {
    case 'start':
      if (message.kind === 'userResponse') {
        return {
          state: {
            kind: 'waitingForModelResponse',
          },
          effects: [
            {
              kind: 'requestModel',
              prompt: message.response,
            },
          ],
        };
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    case 'waitingForTaskExecution': {
      if (message.kind === 'executeTaskResponse') {
        return {
          state: { kind: 'waitingForUserResponse' },
          effects: [{ kind: 'requestUser', request: message.response }],
        };
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    }
    case 'waitingForModelResponse':
      if (message.kind === 'modelResponse') {
        // eslint-disable-next-line default-case
        switch (message.response.kind) {
          case 'execute':
            return {
              state: { kind: 'waitingForExecutionVerification' },
              effects: [
                {
                  kind: 'askVerification',
                  request: message.response.data,
                  refMap: message.refMap,
                },
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
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    case 'waitingForExecutionVerification':
      if (message.kind === 'verification') {
        if (message.response === 'y') {
          return {
            state: { kind: 'waitingForTaskExecution' },
            effects: [
              {
                kind: 'executeTask',
                request: message.request,
                refMap: message.refMap,
              },
            ],
          };
        }
        return {
          state: { kind: 'waitingForUserResponse' },
          effects: [
            {
              kind: 'requestUser',
              request: 'Aborting Execution. Please input a new prompt.',
            },
          ],
        };
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    case 'waitingForUserResponse':
      if (message.kind === 'userResponse') {
        if (message.response === 'quit') {
          return { state: { kind: 'done' }, effects: [{ kind: 'quit' }] };
        }
        return {
          state: { kind: 'waitingForModelResponse' },
          effects: [{ kind: 'requestModel', prompt: message.response }],
        };
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    case 'done':
    default:
      return { state: { kind: 'done' }, effects: [] };
  }
}

export async function run(): Promise<void> {
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
