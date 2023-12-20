import { IMethod } from './types.js';

export abstract class BaseExtension {
  /**
   * Returns the info needed to parse the method into a tool
   * that can be called by the model
   */
  public abstract getExtensionInfo(): IMethod[];
}
