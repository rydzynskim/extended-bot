export type TSchemaTypes =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'integer' }
  | { kind: 'boolean' };

export interface IMethodArg {
  description: string;
  name: string;
  type: TSchemaTypes;
  required: boolean;
}

export interface IMethod {
  description: string;
  name: string;
  args: IMethodArg[];
  functionReference: (...args: any[]) => any;
}
