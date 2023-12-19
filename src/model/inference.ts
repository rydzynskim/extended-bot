import OpenAI from 'openai';
import { TModelResponse } from '../state-machine/types';
import { TTool } from './types';

const prePrompt =
  "If you don't have all the information required for the parameters of a tool, please ask the user for them before calling it.";

const retryAttempts = 1;

export async function askModel(
  prompt: string,
  tools: TTool[],
  attempt: number
): Promise<TModelResponse> {
  // end if we tried too many times
  if (attempt > retryAttempts) {
    return { kind: 'respond', data: 'Error: Model unable to ' };
  }
  // get our open ai key from environment vars
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // query the llm
  let answer: OpenAI.Chat.Completions.ChatCompletion | undefined = void 0;
  try {
    answer = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prePrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools,
      model: 'gpt-3.5-turbo-1106',
    });
  } catch {
    return askModel(prompt, tools, attempt + 1);
  }

  // parse the response
  const { message } = answer.choices[0];

  // if simple message then return to the user
  if (message.content) {
    return { kind: 'respond', data: message.content };
  }

  // if model didn't specify a message or tools retry
  if (typeof message.tool_calls === 'undefined') {
    return askModel(prompt, tools, attempt + 1);
  }

  // otherwise parse the tool call
  return {
    kind: 'execute',
    data: {
      method: message.tool_calls[0]?.function.name,
      args: JSON.parse(message.tool_calls[0]?.function.arguments ?? ''),
    },
  };
}

// helpful resource for counting tokens
// https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken
// const encoding = tiktoken.encoding_for_model('gpt-3.5-turbo');
// const test = encoding.encode('');
// console.log(test.length);
