import { run } from './state-machine/state-machine.js';

// TODO:
// - make the output of the chatbot more reliable and the parsing better (maybe do retries)
// - figure out how much of the conversation to trim in model request
// - add ability to upload files into a prompt
// - stream responses
// - make it so the class methods don't have to be 'self contained'
// - typecheck args in model response
// - figure out good way to handle errors in the tools
// - general code clean up and good comments

run();
