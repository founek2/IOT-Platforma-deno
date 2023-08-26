import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";

const decoder = new TextDecoder()

export async function calculateHash(data: string) {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(data),
    );

    return decoder.decode(hash)
}