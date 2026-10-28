// ============================================================
// Nuba Ops — hook que conecta React con el almacén
// ============================================================

import { useSyncExternalStore } from "react";
import { subscribe } from "../lib/api.js";
import { getDb } from "../lib/store.js";

export function useDb() {
  return useSyncExternalStore(subscribe, getDb, getDb);
}
