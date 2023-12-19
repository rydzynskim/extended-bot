import OpenAI from 'openai';

export type TTool = OpenAI.Chat.Completions.ChatCompletionTool;

export type TPromptMessages =
  OpenAI.Chat.Completions.ChatCompletionMessageParam;

export interface IToolInfo {
  tool: TTool;
  ref: (...args: any[]) => any;
}
