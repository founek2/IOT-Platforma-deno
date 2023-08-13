import { config } from "../config";

interface ILocalStorage {
  length: number;
  setItem: (key: string, value: string) => string;
  getItem: (key: string) => string;
  removeItem: (key: string) => void;
  key: (n: string) => string;
  clear: () => void;
}

const LocalStorage = require("node-localstorage").LocalStorage;
export const localStorage: ILocalStorage = new LocalStorage(
  config.STORAGE_PATH
);
