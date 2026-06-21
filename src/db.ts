import { openDB as idbOpen, IDBPDatabase } from 'idb'
import { HistoryRun } from './types'

const DB_NAME = 'mindgoodizer'
const STORE = 'runs'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = idbOpen(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveRun(run: HistoryRun): Promise<void> {
  const db = await getDb()
  await db.put(STORE, run)
}

export async function getRuns(): Promise<HistoryRun[]> {
  const db = await getDb()
  const all = await db.getAll(STORE)
  return (all as HistoryRun[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteRun(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function clearAll(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE)
}
