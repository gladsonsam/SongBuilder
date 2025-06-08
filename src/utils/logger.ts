/**
 * Logger utility to control console output
 */

// Set to true to enable debug logs, false to disable
const DEBUG_MODE = false;

export const logger = {
  log: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.info(...args);
    }
  }
};
