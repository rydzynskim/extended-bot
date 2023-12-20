import { access, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'path';
import { BaseExtension } from '../base-extension.js';
import { IMethod } from '../types.js';
import { execAsync } from '../../helpers/exec.js';

export class PythonExecutor extends BaseExtension {
  /**
   * Executes the given python code
   *
   * @returns the stdout as a result of running the code
   */
  // eslint-disable-next-line class-methods-use-this
  public async executePython(input: { code: string }): Promise<string> {
    const deleteFileIfExists = async (path: string): Promise<void> => {
      // Check if the file exists
      let fileExists = true;
      try {
        access(path);
      } catch {
        fileExists = false;
      }

      // If no error is thrown, the file exists, so delete it
      if (fileExists) {
        await unlink(path);
      }
    };

    const tmpFile = resolve(process.cwd(), 'tmp.py');
    try {
      // write the code to a temporary file
      await writeFile(tmpFile, input.code);
      // execute the code
      const output = await execAsync(`python3 ${tmpFile}`);
      // clean up the file
      await deleteFileIfExists(tmpFile);

      return output;
    } catch (error) {
      await deleteFileIfExists(tmpFile);

      if (error instanceof Error) {
        return error.message;
      }

      return '';
    }
  }

  public getExtensionInfo(): IMethod[] {
    return [
      {
        description:
          'Run python code, assume no external libraries are available.',
        name: 'executePython',
        args: [
          {
            description: 'The python code to run.',
            name: 'code',
            type: { kind: 'string' },
            required: true,
          },
        ],
        functionReference: this.executePython,
      },
    ];
  }
}
