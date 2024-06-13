export function getEnv(key: string) {
    if ('Deno' in globalThis) {
        return (globalThis as any).Deno.env.get(key);
    }
}