import { BaseExtension } from '../base-extension';
import { IMethod } from '../types';
import { access, writeFile, unlink } from 'fs';
import { resolve } from 'path';
import { execAsync } from '../../helpers/exec';

export class PythonExecutor extends BaseExtension {
  /**
   * Executes the given python code
   *
   * @returns the stdout as a result of running the code
   */
  public async executePython(code: string): Promise<string> {
    const tmpFile = resolve(__dirname, 'tmp.py');
    try {
      // write the code to a temporary file
      await writeFile(tmpFile, code, (err) => {
        throw new Error(err?.message);
      });
      // execute the code
      const output = await execAsync(`python3 ${tmpFile}`);
      // clean up the file
      await this.deleteFileIfExists(tmpFile);

      return output;
    } catch (error) {
      await this.deleteFileIfExists(tmpFile);

      if (error instanceof Error) {
        return error.message;
      }

      return '';
    }
  }

  private async deleteFileIfExists(path: string): Promise<void> {
    try {
      // Check if the file exists
      await access(path, (err) => {
        throw new Error(err?.message);
      });

      // If no error is thrown, the file exists, so delete it
      await unlink(path, (err) => {
        throw new Error(err?.message);
      });
    } catch (error) {
      return void 0;
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
