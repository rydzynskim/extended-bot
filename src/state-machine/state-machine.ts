import { askModel } from '../model/inference.js';
import { getAllTools } from '../model/input-parser.js';
import { TTool } from '../model/types.js';
import {
  startTaskExecutionDisplay,
  stopTaskExecutionDisplay,
  waitForUserInput,
  systemLog,
} from '../helpers/cli.js';
import {
  TEffect,
  TStateMachineEvents,
  TState,
  TMessage,
  TypedEventEmitter,
} from './types.js';

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
        const answer = await askModel(effect.conversation, tools, 0);

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
        const prompt = await waitForUserInput(effect.request, effect.prefix);

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
        let result = '';
        try {
          result = await effect.refMap[effect.request.method](
            effect.request.args
          );
          stopTaskExecutionDisplay(interval, effect.request.method);
        } catch (error) {
          if (error instanceof Error) {
            result = error.message;
          }
          stopTaskExecutionDisplay(interval, effect.request.method);
          systemLog(`An error occured while using extension: ${result}`);
        }

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
        const response = (await waitForUserInput(question, 'SYSTEM')) as
          | 'y'
          | 'n';

        emitter.emit(
          'message',
          {
            kind: 'verification',
            response,
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
        state.conversation.push({
          role: 'user',
          content: message.response,
        });
        return {
          state: {
            kind: 'waitingForModelResponse',
            conversation: state.conversation,
          },
          effects: [
            {
              kind: 'requestModel',
              conversation: state.conversation,
            },
          ],
        };
      }
      throw new Error(
        `Invalid message: ${message.kind} for state: ${state.kind}`
      );
    case 'waitingForTaskExecution': {
      if (message.kind === 'executeTaskResponse') {
        state.conversation.push({
          role: 'tool',
          content: message.response,
          tool_call_id: state.id,
        });
        return {
          state: {
            kind: 'waitingForModelResponse',
            conversation: state.conversation,
          },
          effects: [{ kind: 'requestModel', conversation: state.conversation }],
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
              state: {
                kind: 'waitingForExecutionVerification',
                request: message.response.data,
                refMap: message.refMap,
                conversation: state.conversation,
              },
              effects: [
                {
                  kind: 'askVerification',
                  request: message.response.data,
                },
              ],
            };
          case 'respond':
            state.conversation.push({
              role: 'assistant',
              content: message.response.data,
            });
            return {
              state: {
                kind: 'waitingForUserResponse',
                conversation: state.conversation,
              },
              effects: [
                {
                  kind: 'requestUser',
                  request: message.response.data,
                  prefix: 'MODEL',
                },
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
          state.conversation.push({
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: state.request.id,
                type: 'function',
                function: {
                  name: state.request.method,
                  arguments: JSON.stringify(state.request.args),
                },
              },
            ],
          });
          return {
            state: {
              kind: 'waitingForTaskExecution',
              conversation: state.conversation,
              id: state.request.id,
            },
            effects: [
              {
                kind: 'executeTask',
                request: state.request,
                refMap: state.refMap,
              },
            ],
          };
        }
        // if the user doesn't want to execute the task then
        // pop off the last question they asked
        state.conversation.pop();
        return {
          state: {
            kind: 'waitingForUserResponse',
            conversation: state.conversation,
          },
          effects: [
            {
              kind: 'requestUser',
              request: 'Aborting Execution. Please input a new prompt.',
              prefix: 'SYSTEM',
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
        state.conversation.push({
          role: 'user',
          content: message.response,
        });
        return {
          state: {
            kind: 'waitingForModelResponse',
            conversation: state.conversation,
          },
          effects: [{ kind: 'requestModel', conversation: state.conversation }],
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
  let state: TState = { kind: 'start', conversation: [] };
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
    'Hi, welcome to the extend chatbot. How can I help you today?',
    'MODEL'
  );
  messageHandler({ kind: 'userResponse', response: initialPrompt }, emitter);
}
