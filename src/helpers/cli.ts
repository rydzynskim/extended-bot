import { createInterface } from 'readline';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

export function startTaskExecutionDisplay(
  extensionName: string
): NodeJS.Timeout {
  const spinningChars = ['--', '\\', '|', '/'];
  const displayText = chalk.yellowBright(
    `[SYSTEM] using ${chalk.bold(extensionName)} extension `
  );
  process.stdout.write(displayText);
  process.stdout.write('\x1B[?25l');
  let currentChar = 0;
  const interval = setInterval(() => {
    process.stdout.cursorTo(stripAnsi(displayText).length);
    process.stdout.clearLine(1);
    process.stdout.write(chalk.yellowBright(`${spinningChars[currentChar]}`));
    currentChar = (currentChar + 1) % spinningChars.length;
  }, 50);

  return interval;
}

export function stopTaskExecutionDisplay(
  interval: NodeJS.Timeout,
  extensionName: string
): void {
  clearInterval(interval);
  process.stdout.clearLine(-1);
  process.stdout.cursorTo(0);
  process.stdout.write('\x1B[?25h');
  process.stdout.write(
    chalk.yellowBright(`[SYSTEM] used ${chalk.bold(extensionName)} extension\n`)
  );
}

export function systemLog(log: string): void {
  // eslint-disable-next-line no-console
  console.log(chalk.yellowBright(`[SYSTEM] ${log}`));
}

export async function waitForUserInput(
  prompt: string,
  prefix: string
): Promise<string> {
  let formattedPrompt = `${chalk.cyanBright(`[${prefix}] ${prompt}`)}\n[USER] `;
  if (prefix === 'SYSTEM') {
    formattedPrompt = `${chalk.yellowBright(`[${prefix}] ${prompt}`)}\n[USER] `;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    readline.question(formattedPrompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}
