// model params
export const CONTEXT_WINDOW = 16385;
export const OUTPUT_TOKENS = 4096;

// values beyond this point were obtained through
// experimenting with different prompts

// message token counting
export const MESSAGE_OVERHEAD = 4;
export const TOTAL_MESSAGE_OVERHEAD = 3;

// tool token counting
export const TOOL_OVERHEAD = 6;
export const TOTAL_TOOL_OVERHEAD = 16;
export const PROPERTY_OVERHEAD = 5;
export const TOTAL_PROPERTY_OVERHEAD = 3;
