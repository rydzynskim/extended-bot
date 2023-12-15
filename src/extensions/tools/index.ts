import { BaseExtension } from '../base-extension';
import { PythonExecutor } from './python-executor';

export const extensions: BaseExtension[] = [new PythonExecutor()];
