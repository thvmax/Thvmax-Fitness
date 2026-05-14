import { supabase } from "./supabase";
import { WorkoutRecord, ProgressEntry, UserStats, ExerciseLog } from "./types";

// For anonymous usage without auth, we use a single hardcoded UUID.
// In the future, this can be dynamically set by Supabase Auth.
const USER_ID = "00000000-0000-0000-0000-000000000000";

// ─── Helpers ───────────────────────────────────────────────

function mapWorkoutRecord(row: any): WorkoutRecord {
  return {
    id: row.id,
    date: row.date,
    dayKey: row.day_key,
    dayTitle: row.day_title,
    exercises: row.exercises,
    completedCount: row.completed_count,
    totalCount: row.total_count,
    duration: row.duration,
    mood: row.mood,
  };
}

function mapProgressEntry(row: any): ProgressEntry {
  return {
    id: row.id,
    date: row.date,
    week: row.week,
    photoFront: row.photo_front,
    photoSide: row.photo_side,
    photoBack: row.photo_back,
    weight: row.weight,
    bodyFat: row.body_fat,
    chest: row.chest,
    waist: row.waist,
    arms: row.arms,
    thighs: row.thighs,
    notes: row.notes,
  };
}

// ─── Workout Records ──────────────────────────────────────

export async function getWorkoutRecords(): Promise<WorkoutRecord[]> {
  const { data, error } = await supabase
    .from("workout_records")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching workout records:", error);
    return [];
  }
  return data.map(mapWorkoutRecord);
}

export async function saveWorkoutRecord(record: WorkoutRecord): Promise<void> {
  const { error } = await supabase.from("workout_records").upsert({
    id: record.id,
    user_id: USER_ID,
    date: record.date,
    day_key: record.dayKey,
    day_title: record.dayTitle,
    exercises: record.exercises,
    completed_count: record.completedCount,
    total_count: record.totalCount,
    duration: record.duration,
    mood: record.mood,
  }, { onConflict: 'id' });

  if (error) console.error("Error saving workout record:", error);
}

export async function getWorkoutRecordByDate(date: string, dayKey: string): Promise<WorkoutRecord | undefined> {
  const { data, error } = await supabase
    .from("workout_records")
    .select("*")
    .eq("date", date)
    .eq("day_key", dayKey)
    .single();

  if (error || !data) return undefined;
  return mapWorkoutRecord(data);
}

export async function deleteWorkoutRecord(id: string): Promise<void> {
  const { error } = await supabase.from("workout_records").delete().eq("id", id);
  if (error) console.error("Error deleting workout record:", error);
}

export async function getThisWeekRecords(): Promise<WorkoutRecord[]> {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("workout_records")
    .select("*")
    .gte("date", mondayStr)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching this week's records:", error);
    return [];
  }
  return data.map(mapWorkoutRecord);
}

// ─── Current Session (in-progress) ────────────────────────

export interface CurrentSession {
  dayKey: string;
  date: string;
  startTime: number;
  exercises: Record<string, ExerciseLog>;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  // To avoid multiple sessions for one user, we'll just get the latest one
  const { data, error } = await supabase
    .from("current_sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    dayKey: data.day_key,
    date: data.date,
    startTime: data.start_time,
    exercises: data.exercises,
  };
}

export async function saveCurrentSession(session: CurrentSession): Promise<void> {
  const { error } = await supabase.from("current_sessions").upsert({
    id: "00000000-0000-0000-0000-000000000001", // Single row for in-progress session
    user_id: USER_ID,
    day_key: session.dayKey,
    date: session.date,
    start_time: session.startTime,
    exercises: session.exercises,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (error) console.error("Error saving current session:", error);
}

export async function clearCurrentSession(): Promise<void> {
  const { error } = await supabase
    .from("current_sessions")
    .delete()
    .eq("id", "00000000-0000-0000-0000-000000000001");
  if (error) console.error("Error clearing current session:", error);
}

// ─── Progress Entries ─────────────────────────────────────

export async function getProgressEntries(): Promise<ProgressEntry[]> {
  const { data, error } = await supabase
    .from("progress_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching progress entries:", error);
    return [];
  }
  return data.map(mapProgressEntry);
}

export async function saveProgressEntry(entry: ProgressEntry): Promise<void> {
  const { error } = await supabase.from("progress_entries").upsert({
    id: entry.id,
    user_id: USER_ID,
    date: entry.date,
    week: entry.week,
    photo_front: entry.photoFront,
    photo_side: entry.photoSide,
    photo_back: entry.photoBack,
    weight: entry.weight,
    body_fat: entry.bodyFat,
    chest: entry.chest,
    waist: entry.waist,
    arms: entry.arms,
    thighs: entry.thighs,
    notes: entry.notes,
  }, { onConflict: 'id' });

  if (error) console.error("Error saving progress entry:", error);
}

export async function deleteProgressEntry(id: string): Promise<void> {
  const { error } = await supabase.from("progress_entries").delete().eq("id", id);
  if (error) console.error("Error deleting progress entry:", error);
}

// ─── User Stats ───────────────────────────────────────────

export async function getUserStats(): Promise<UserStats> {
  const defaults: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    thisWeekCompleted: 0,
    joinDate: new Date().toISOString().split("T")[0],
  };

  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", USER_ID)
    .maybeSingle();

  if (error || !data) return defaults;

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    totalWorkouts: data.total_workouts,
    thisWeekCompleted: 0, // This should be calculated or passed dynamically
    joinDate: data.join_date,
  };
}

export async function recalculateStats(): Promise<UserStats> {
  const records = await getWorkoutRecords();
  const weekRecords = await getThisWeekRecords();

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

  const existingStats = await getUserStats();
  const stats: UserStats = {
    currentStreak: streak,
    longestStreak: Math.max(streak, existingStats.longestStreak),
    totalWorkouts: records.length,
    thisWeekCompleted: weekRecords.length,
    joinDate: existingStats.joinDate,
  };

  await supabase.from("user_stats").upsert({
    user_id: USER_ID,
    current_streak: stats.currentStreak,
    longest_streak: stats.longestStreak,
    total_workouts: stats.totalWorkouts,
    join_date: stats.joinDate,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

  return stats;
}

// ─── Photo Storage via Supabase ───────────────────────────

export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${id}.jpg`, { type: "image/jpeg" });

    const { error } = await supabase.storage
      .from("progress_photos")
      .upload(`${id}.jpg`, file, { upsert: true });

    if (error) console.error("Error uploading photo:", error);
  } catch (err) {
    console.error("Failed to convert/upload dataUrl to file", err);
  }
}

export async function getPhoto(id: string): Promise<string | null> {
  const { data } = supabase.storage
    .from("progress_photos")
    .getPublicUrl(`${id}.jpg`);
  
  return data.publicUrl;
}

export async function deletePhoto(id: string): Promise<void> {
  const { error } = await supabase.storage
    .from("progress_photos")
    .remove([`${id}.jpg`]);
  
  if (error) console.error("Error deleting photo:", error);
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

export async function exportAllData(): Promise<string> {
  const workoutRecords = await getWorkoutRecords();
  const progressEntries = await getProgressEntries();
  const userStats = await getUserStats();
  
  const data = {
    workoutRecords,
    progressEntries,
    userStats,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    if (data.workoutRecords) {
      for (const r of data.workoutRecords) await saveWorkoutRecord(r);
    }
    if (data.progressEntries) {
      for (const e of data.progressEntries) await saveProgressEntry(e);
    }
    if (data.userStats) {
      // Simplification for import
      await supabase.from("user_stats").upsert({
        user_id: USER_ID,
        current_streak: data.userStats.currentStreak,
        longest_streak: data.userStats.longestStreak,
        total_workouts: data.userStats.totalWorkouts,
        join_date: data.userStats.joinDate,
      });
    }
    return true;
  } catch {
    return false;
  }
}
