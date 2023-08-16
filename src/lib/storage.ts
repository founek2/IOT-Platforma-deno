import { config } from "../config.ts";
import { LocalStorage } from "npm:node-localstorage";

export const localStorage = new LocalStorage(
  config.STORAGE_PATH
);
