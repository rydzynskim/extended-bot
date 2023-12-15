import OpenAI from 'openai';

export type TTool = OpenAI.Chat.Completions.ChatCompletionTool;

export interface IToolInfo {
  tool: TTool;
  ref: (...args: any[]) => any;
}
