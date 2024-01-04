import { run } from './state-machine/state-machine.js';

// TODO:
// - make the update function more pure (should not be doing anything besides updating state and spawning effects)
// - consider type break up (show and clear history were a bit weird)

run();
