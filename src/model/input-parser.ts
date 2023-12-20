import { IMethod, IMethodArg } from '../extensions/types.js';
import { extensions } from '../extensions/tools/index.js';
import { IToolInfo } from './types.js';

function parseArg(args: IMethodArg[]): {
  type: 'object';
  properties: any;
  required: string[];
} {
  const schema: {
    type: 'object';
    properties: any;
    required: string[];
  } = { type: 'object', properties: {}, required: [] as string[] };
  const properties: any = {};
  const required: string[] = [];
  for (const arg of args) {
    properties[arg.name] = {
      type: arg.type.kind,
      description: arg.description,
    };
    if (arg.required) {
      required.push(arg.name);
    }
  }
  schema.properties = properties;
  schema.required = required;

  return schema;
}

function parseMethodsToTools(methods: IMethod[]): Array<IToolInfo> {
  const tools: Array<IToolInfo> = [];
  for (const method of methods) {
    tools.push({
      tool: {
        type: 'function',
        function: {
          description: method.description,
          name: method.name,
          parameters: parseArg(method.args),
        },
      },
      ref: method.functionReference,
    });
  }

  return tools;
}

export function getAllTools(): Record<string, IToolInfo> {
  const allTools: Record<string, IToolInfo> = {};
  for (const instance of extensions) {
    for (const { tool, ref } of parseMethodsToTools(
      instance.getExtensionInfo()
    ))
      allTools[tool.function.name] = { tool, ref };
  }

  return allTools;
}
