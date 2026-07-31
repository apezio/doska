import type { KeyValue } from "@doska/ports"

export const webKeyValue: KeyValue = {
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
}
