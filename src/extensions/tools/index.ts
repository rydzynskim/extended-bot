import { BaseExtension } from '../base-extension.js';
import { PythonExecutor } from './python-executor.js';

export const extensions: BaseExtension[] = [new PythonExecutor()];
