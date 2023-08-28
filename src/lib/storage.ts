// @deno-types="npm:@types/node-localstorage"
import { LocalStorage } from "npm:node-localstorage";

export const localStorage = new LocalStorage(
  Deno.env.get("STORAGE_PATH") || "local-storage"
);
