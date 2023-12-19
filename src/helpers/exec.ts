import { exec } from 'child_process';

export function execAsync(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        resolve(err?.message ?? '');
      }

      resolve(stdout);
    });
  });
}
