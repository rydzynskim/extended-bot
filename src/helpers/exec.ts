import { exec } from 'child_process';
import { deferPromise } from './promise';

export function execAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (typeof stderr === 'string') {
        reject(new Error(stderr));
      }

      if (typeof err !== 'undefined') {
        reject(err);
      }

      resolve(stdout);
    });
  });
}
