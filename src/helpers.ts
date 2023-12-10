import { createInterface } from 'readline';
import axios from 'axios';
import { IExecutePayload } from './types';

function startTaskExecutionDisplay(extensionName: string): NodeJS.Timer {
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

function stopTaskExecutionDisplay(interval: NodeJS.Timer): void {
  clearInterval(interval);
  process.stdout.clearLine(-1);
  process.stdout.cursorTo(0);
}

async function waitMs(timeMs: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeMs));
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

export async function getExtension(prompt: string): Promise<string> {
  const res = await axios.post(
    'http://localhost:3000/extension',
    JSON.stringify({ prompt }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  return res.data;
}

export async function executeTask(payload: IExecutePayload): Promise<string> {
  const interval = startTaskExecutionDisplay(payload.extension);
  const res = await axios.post(
    'http://localhost:3000/execute',
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  // wait for 5 seconds so the user can see the execution happening
  await waitMs(5000);
  stopTaskExecutionDisplay(interval);

  return res.data;
}
