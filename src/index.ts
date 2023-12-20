import { run } from './state-machine';

// TODO:
// - make the output of the chatbot more reliable and the parsing better (maybe do retries)
// - figure out how much of the conversation to trim in model request
// - add ability to upload files into a prompt
// - stream responses
// - make it so the class methods don't have to be 'self contained'
// - typecheck args in model response
// - add coloring to the cli to make it easier to look at
// - fix spacing weirdness on newlines in console

run();
