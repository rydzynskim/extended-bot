import tiktoken from 'tiktoken';
import { TPromptMessages, TTool } from './types.js';
import * as config from './constants.js';

function countPromptTokens(
  prePrompt: string,
  prompt: TPromptMessages[]
): number {
  const encoding = tiktoken.encoding_for_model('gpt-3.5-turbo-1106');

  let total = encoding.encode(prePrompt).length + config.MESSAGE_OVERHEAD;
  for (const message of prompt) {
    if (message.content) {
      total +=
        encoding.encode(message.content as string).length +
        config.MESSAGE_OVERHEAD;
    } else if (message.role === 'assistant' && message.tool_calls) {
      total +=
        encoding.encode(JSON.stringify(message.tool_calls)).length +
        config.MESSAGE_OVERHEAD;
    }
  }

  return total + config.TOTAL_MESSAGE_OVERHEAD;
}

function countToolTokens(tools: TTool[]): number {
  const encoding = tiktoken.encoding_for_model('gpt-3.5-turbo-1106');

  let total = 0;
  for (const tool of tools) {
    const properties = tool.function.parameters.properties as any;
    const descriptionCount = encoding.encode(
      tool.function.description ?? ''
    ).length;
    const nameCount = encoding.encode(tool.function.name).length;
    let propertyCount = config.TOTAL_PROPERTY_OVERHEAD;
    for (const key of Object.keys(properties)) {
      propertyCount +=
        config.PROPERTY_OVERHEAD +
        encoding.encode(key).length +
        encoding.encode(properties[key].description).length;
    }
    total +=
      config.TOOL_OVERHEAD + descriptionCount + nameCount + propertyCount;
  }

  return total + config.TOTAL_TOOL_OVERHEAD;
}

/**
 * Given the conversation so far, trims the prompt so that:
 * ```
 * context_window-output_tokens>tokens(input)
 * ```
 * Modifies `prompt` in place
 */
export function trimConversation(
  prePrompt: string,
  prompt: TPromptMessages[],
  tools: TTool[]
): void {
  const toolTokens = countToolTokens(tools);
  const maxInput = config.CONTEXT_WINDOW - config.OUTPUT_TOKENS;

  if (toolTokens > maxInput) {
    throw new Error('The tools have exceeded the max tokens for the model.');
  }

  // this is a dumb way to do this but easy to write for now
  while (countPromptTokens(prePrompt, prompt) + toolTokens > maxInput) {
    if (prePrompt.length === 0) {
      throw new Error(
        'Input exceeds max tokens and cannot trim the prompt any more.'
      );
    }

    // delete the oldest prompts
    prompt.shift();
  }
}
