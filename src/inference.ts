import OpenAI from 'openai';
import { TModelResponse } from './types';

type TOpenAIFunction =
  OpenAI.Chat.Completions.ChatCompletionCreateParams.Function;

const functionDefinition: TOpenAIFunction = {
  description:
    'Calls the tool described in the prompt. Make sure the function call adheres to the following schema: {"extension":"string","method":"string","args":"object"}',
  name: 'extend',
  parameters: {
    type: 'object',
    properties: {
      extension: {
        type: 'string',
        description: 'The name of the extension',
      },
      method: {
        type: 'string',
        description:
          'The method of the extension to call to perform the task for the user',
      },
      args: {
        type: 'object',
        description: 'The args to pass to the method.',
      },
    },
    required: ['extension', 'method', 'args'],
  },
};

const prePrompt1 = 'You have the following tool available to you:\n' + '```\n';

const prePrompt2 =
  '```\n' +
  "Only use the tool if the user has explicitly asked you to use it. Your response must exactly match the JSON schema for the provided function. If you don't have all the information required for the arguments of the extension method, please ask the user for them before calling it.";

export async function askModel(
  prompt: string,
  extension: string
): Promise<TModelResponse> {
  // get our open ai key from environment vars
  const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

  // query the llm
  const answer = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prePrompt1 + extension + prePrompt2,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    functions: [functionDefinition],
    model: 'gpt-3.5-turbo',
  });

  // parse the response
  const { message } = answer.choices[0];
  if (message.content) {
    return { kind: 'respond', data: message.content };
  }
  const payload = JSON.parse(message.function_call?.arguments ?? '');

  return {
    kind: 'execute',
    data: {
      extension: payload.extension,
      endpoint: payload.method,
      args: payload.args,
    },
  };
}

// helpful resource for counting tokens
// https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken
// const encoding = tiktoken.encoding_for_model('gpt-3.5-turbo');
// const test = encoding.encode('');
// console.log(test.length);
