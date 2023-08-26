
import { Buffer } from 'node:buffer';

export type cbFn = (topic: string, message: Buffer, groups: string[]) => void;
export function topicParser(topic: string, message: Buffer) {
    return (stringTemplate: string, fn: cbFn) => {
        const regex = new RegExp('^' + stringTemplate.replace('$', '\\$').replace(/\+/g, '([^/\\$]+)') + '$');
        const match = topic.match(regex);
        if (!match) return;

        const [_wholeMatch, ...groups] = match;
        fn(topic, message, groups || []);
    };
}