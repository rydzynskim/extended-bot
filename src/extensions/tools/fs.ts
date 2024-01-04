import { readFile, writeFile } from 'node:fs/promises';
import { BaseExtension } from '../base-extension.js';
import { IMethod } from '../types.js';

export class FileSystem extends BaseExtension {
  /**
   * Reads and returns the contents of the file at the specified path
   */
  // eslint-disable-next-line class-methods-use-this
  public async readFromFile(input: { path: string }): Promise<string> {
    return readFile(input.path, 'utf8');
  }

  /**
   * Write the specified contents to a file created at the specified path
   */
  // eslint-disable-next-line class-methods-use-this
  public async writeToFile(input: {
    path: string;
    contents: string;
  }): Promise<string> {
    await writeFile(input.path, input.contents);

    return 'Successfully wrote data to file';
  }

  public getExtensionInfo(): IMethod[] {
    return [
      {
        description: 'Read the contents of the file at the specified path.',
        name: 'readFile',
        args: [
          {
            description: 'The path of the file to read from.',
            name: 'path',
            type: { kind: 'string' },
            required: true,
          },
        ],
        functionReference: this.readFromFile,
      },
      {
        description: 'Write the contents to a file at the specified path.',
        name: 'writeFile',
        args: [
          {
            description: 'The path of the file to write to.',
            name: 'path',
            type: { kind: 'string' },
            required: true,
          },
          {
            description: 'The contents to write to the file.',
            name: 'contents',
            type: { kind: 'string' },
            required: true,
          },
        ],
        functionReference: this.writeToFile,
      },
    ];
  }
}
