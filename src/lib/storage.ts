import { config } from "../config.ts";
// @deno-types="npm:@types/node-localstorage"
import { LocalStorage } from "npm:node-localstorage";

export const localStorage = new LocalStorage(
  config.STORAGE_PATH
);
