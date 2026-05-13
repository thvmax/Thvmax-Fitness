import { WorkoutRecord, ProgressEntry, UserStats, ExerciseLog } from "./types";

const STORAGE_KEYS = {
  WORKOUT_RECORDS: "thvmax_workout_records",
  PROGRESS_ENTRIES: "thvmax_progress_entries",
  USER_STATS: "thvmax_user_stats",
  CURRENT_SESSION: "thvmax_current_session",
};

// ─── Helpers ───────────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write failed:", e);
  }
}

// ─── Workout Records ──────────────────────────────────────

export function getWorkoutRecords(): WorkoutRecord[] {
  return getItem<WorkoutRecord[]>(STORAGE_KEYS.WORKOUT_RECORDS, []);
}

export function saveWorkoutRecord(record: WorkoutRecord): void {
  const records = getWorkoutRecords();
  const existingIdx = records.findIndex(
    (r) => r.date === record.date && r.dayKey === record.dayKey
  );
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.push(record);
  }
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setItem(STORAGE_KEYS.WORKOUT_RECORDS, records);
}

export function getWorkoutRecordByDate(date: string, dayKey: string): WorkoutRecord | undefined {
  return getWorkoutRecords().find((r) => r.date === date && r.dayKey === dayKey);
}

export function getThisWeekRecords(): WorkoutRecord[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return getWorkoutRecords().filter(
    (r) => new Date(r.date) >= monday
  );
}

// ─── Current Session (in-progress) ────────────────────────

export interface CurrentSession {
  dayKey: string;
  date: string;
  startTime: number;
  exercises: Record<string, ExerciseLog>;
}

export function getCurrentSession(): CurrentSession | null {
  return getItem<CurrentSession | null>(STORAGE_KEYS.CURRENT_SESSION, null);
}

export function saveCurrentSession(session: CurrentSession): void {
  setItem(STORAGE_KEYS.CURRENT_SESSION, session);
}

export function clearCurrentSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

// ─── Progress Entries ─────────────────────────────────────

export function getProgressEntries(): ProgressEntry[] {
  return getItem<ProgressEntry[]>(STORAGE_KEYS.PROGRESS_ENTRIES, []);
}

export function saveProgressEntry(entry: ProgressEntry): void {
  const entries = getProgressEntries();
  const existingIdx = entries.findIndex((e) => e.id === entry.id);
  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setItem(STORAGE_KEYS.PROGRESS_ENTRIES, entries);
}

export function deleteProgressEntry(id: string): void {
  const entries = getProgressEntries().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.PROGRESS_ENTRIES, entries);
}

// ─── User Stats ───────────────────────────────────────────

export function getUserStats(): UserStats {
  const defaults: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    thisWeekCompleted: 0,
    joinDate: new Date().toISOString().split("T")[0],
  };
  return getItem<UserStats>(STORAGE_KEYS.USER_STATS, defaults);
}

export function recalculateStats(): UserStats {
  const records = getWorkoutRecords();
  const weekRecords = getThisWeekRecords();

  // Calculate streak
  let streak = 0;
  const uniqueDays = [...new Set(records.map((r) => r.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (uniqueDays.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const curr = new Date(uniqueDays[i - 1]);
        const prev = new Date(uniqueDays[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
        if (diffDays <= 2) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const stats: UserStats = {
    currentStreak: streak,
    longestStreak: Math.max(streak, getUserStats().longestStreak),
    totalWorkouts: records.length,
    thisWeekCompleted: weekRecords.length,
    joinDate: getUserStats().joinDate,
  };

  setItem(STORAGE_KEYS.USER_STATS, stats);
  return stats;
}

// ─── Photo Storage via IndexedDB ──────────────────────────

const DB_NAME = "thvmax_photos";
const DB_VERSION = 1;
const STORE_NAME = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, dataUrl, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhoto(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.dataUrl || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Image Compression ────────────────────────────────────

export function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Export / Import ──────────────────────────────────────

export function exportAllData(): string {
  const data = {
    workoutRecords: getWorkoutRecords(),
    progressEntries: getProgressEntries(),
    userStats: getUserStats(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.workoutRecords) setItem(STORAGE_KEYS.WORKOUT_RECORDS, data.workoutRecords);
    if (data.progressEntries) setItem(STORAGE_KEYS.PROGRESS_ENTRIES, data.progressEntries);
    if (data.userStats) setItem(STORAGE_KEYS.USER_STATS, data.userStats);
    return true;
  } catch {
    return false;
  }
}
