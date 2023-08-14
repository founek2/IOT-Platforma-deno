import { config } from "../config.ts";
import { LocalStorage } from "node-localstorage";

export const localStorage = new LocalStorage(
  config.STORAGE_PATH
);
