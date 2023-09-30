import { loggerFn } from './fn.ts';

const loggerNode = loggerFn(false);

const consoleLog = loggerNode(console);

export enum LogLevel {
    ERROR,
    WARNING,
    INFO,
    DEBUG,
    SILLY,
}

export const logger = {
    info: consoleLog('green', 'INFO   ', LogLevel.INFO),
    warning: consoleLog('orange', 'WARNING', LogLevel.WARNING),
    error: consoleLog('red', 'ERROR  ', LogLevel.ERROR),
    debug: consoleLog('blue', 'DEBUG  ', LogLevel.DEBUG),
    silly: consoleLog('yellow', 'SILLY  ', LogLevel.SILLY),
};

export type Logger = typeof logger