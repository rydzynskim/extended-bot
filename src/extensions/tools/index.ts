import { BaseExtension } from '../base-extension.js';
import { PythonExecutor } from './python-executor.js';
import { Mysql } from './mysql.js';

export const extensions: BaseExtension[] = [new PythonExecutor(), new Mysql()];
