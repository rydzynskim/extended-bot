import OpenAI from 'openai';
import { TModelResponse } from '../state-machine/types.js';
import { TPromptMessages, TTool } from './types.js';
import { trimConversation } from './tokens.js';
import { systemLog } from '../helpers/cli.js';

const retryAttempts = 1;

export const prePrompt =
  "Don't call a tool unless the user explicitly asks you to call a tool. If you don't have all the information required for the parameters of a tool, please ask the user for them before calling it.";

export async function askModel(
  prompt: TPromptMessages[],
  tools: TTool[],
  attempt: number
): Promise<TModelResponse> {
  // end if we tried too many times
  if (attempt > retryAttempts) {
    return {
      kind: 'respond',
      data: 'Error: Model unable to produce output, please try again.',
    };
  }

  // trim the conversation history if it is over the allowable
  // token input for the model
  trimConversation(prePrompt, prompt, tools);

  // get our open ai key from environment vars
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // query the llm
  let answer: OpenAI.Chat.Completions.ChatCompletion | undefined = void 0;
  try {
    systemLog('waiting for model response...');
    answer = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: prePrompt,
        },
        ...prompt,
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
      id: message.tool_calls[0].id,
      args: JSON.parse(message.tool_calls[0]?.function.arguments ?? ''),
    },
  };
}
