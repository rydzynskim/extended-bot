import { run } from './state-machine';

// TODO:
// - make the output of the chatbot more reliable and the parsing better (maybe do retries)
// - add full conversation to the model prompt
// - figure out how much of the conversation to trim in model request
// - where to input preprompt within that conversation
// - fine tune preprompt through experimentation
// - vector search over available tools to decrease token spend?
// - add logger that writes to a log file so the interface with model doesn't get confusing
// - add ability to upload files?
// - extension specifies what we do with output, just return or give to model to summarize
// - ability to run multiple tool calls in a row, output from one input into another

run();
