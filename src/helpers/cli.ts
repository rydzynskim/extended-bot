import { createInterface } from 'readline';

export function startTaskExecutionDisplay(
  extensionName: string
): NodeJS.Timeout {
  const spinningChars = ['--', '\\', '|', '/'];
  const displayText = `\nUsing ${extensionName} Extension `;
  process.stdout.write(displayText);
  let currentChar = 0;
  const interval = setInterval(() => {
    process.stdout.cursorTo(displayText.length);
    process.stdout.clearLine(1);
    process.stdout.write(`${spinningChars[currentChar]}`);
    currentChar = (currentChar + 1) % spinningChars.length;
  }, 50);

  return interval;
}

export function stopTaskExecutionDisplay(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  process.stdout.clearLine(-1);
  process.stdout.cursorTo(0);
}

export async function waitForUserInput(prompt: string): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    readline.question(`\n\n${prompt}\n\n`, (answer) => {
      resolve(answer);
    });
  });
}
