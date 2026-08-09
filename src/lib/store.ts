/**
 * Local record store backed by IndexedDB.
 *
 * Inspection records embed a base64 guard photo (~200-400KB each), which
 * overruns the ~5MB localStorage cap after roughly 15-20 inspections and makes
 * writes throw QuotaExceededError. IndexedDB has no practical cap, so records
 * survive instead of being silently dropped.
 *
 * Every call is async so that swapping this file for a server-backed
 * implementation later does not change any caller.
 */

const DB_NAME = "icici-guard-check";
const DB_VERSION = 1;
const STORE = "inspections";
/** localStorage key used before the move to IndexedDB; drained on first open. */
const LEGACY_KEY = "icici-inspections";

export interface StoredRecord {
  id: string;
}

function supported(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | undefined;

/** Ask the browser not to evict saved inspections under storage pressure. */
function requestPersistence(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* not supported — records still persist normally */
  }
}

function openDb(): Promise<IDBDatabase> {

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("Could not open local storage."));
      req.onblocked = () => reject(new Error("Local storage is busy in another tab."));
    });
    // Do not cache a rejected connection — let the next call retry.
    dbPromise.catch(() => {
      dbPromise = undefined;
    });
  }
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        // Resolve on transaction completion, not request success, so that a
        // failed commit (e.g. disk full) surfaces as an error rather than a
        // write that looks like it landed.
        let result: T;
        req.onsuccess = () => {
          result = req.result;
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () =>
          reject(tx.error ?? req.error ?? new Error("Local storage write failed."));
        tx.onabort = () => reject(tx.error ?? new Error("Local storage write was cancelled."));
      }),
  );
}

let migration: Promise<void> | undefined;

/** Moves any records left in localStorage into IndexedDB, once per page load. */
function migrateLegacy(): Promise<void> {
  if (!migration) {
    migration = drainLegacy().catch((err) => {
      console.error("Could not migrate saved inspections from localStorage", err);
    });
  }
  return migration;
}

async function drainLegacy(): Promise<void> {
  if (typeof localStorage === "undefined") return;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return; // storage blocked (private mode / disabled cookies)
  }
  if (!raw) return;

  let legacy: unknown;
  try {
    legacy = JSON.parse(raw);
  } catch {
    localStorage.removeItem(LEGACY_KEY);
    return;
  }

  const records = Array.isArray(legacy)
    ? (legacy as StoredRecord[]).filter((r) => r && typeof r.id === "string")
    : [];

  if (records.length > 0) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const record of records) store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // Only drop the old copy once the records are safely committed.
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* nothing we can do */
  }
}

export async function allRecords<T extends StoredRecord>(): Promise<T[]> {
  if (!supported()) return [];
  try {
    await migrateLegacy();
    return await run<T[]>("readonly", (s) => s.getAll() as IDBRequest<T[]>);
  } catch (err) {
    console.error("Could not read saved inspections", err);
    return [];
  }
}

export async function getRecord<T extends StoredRecord>(id: string): Promise<T | undefined> {
  if (!supported()) return undefined;
  try {
    await migrateLegacy();
    return await run<T | undefined>("readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
  } catch (err) {
    console.error("Could not read saved inspection", err);
    return undefined;
  }
}

/** Rejects when the record could not be stored, so callers can tell the user. */
export async function putRecord<T extends StoredRecord>(record: T): Promise<void> {
  if (!supported()) {
    throw new Error("This browser cannot store inspections on the device.");
  }
  await migrateLegacy();
  await run("readwrite", (s) => s.put(record));
}

export async function removeRecord(id: string): Promise<void> {
  if (!supported()) return;
  await migrateLegacy();
  await run("readwrite", (s) => s.delete(id));
}
