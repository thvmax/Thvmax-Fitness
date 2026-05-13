"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WORKOUT_DAYS, getTodayWorkout, getWorkoutByKey } from "@/lib/workout-data";
import {
  getCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
  saveWorkoutRecord,
  getWorkoutRecordByDate,
  CurrentSession,
} from "@/lib/storage";
import { ExerciseLog, WorkoutRecord, Exercise } from "@/lib/types";

const TYPE_META: Record<string, { tag: string; tagColor: string; className: string }> = {
  compound: { tag: "COMPOUND", tagColor: "#E8E8EC", className: "badge-compound" },
  isolation: { tag: "ISO", tagColor: "#8888A0", className: "badge-isolation" },
  "superset-a": { tag: "SS-A", tagColor: "#FFB400", className: "badge-superset" },
  "superset-b": { tag: "SS-B", tagColor: "#FFB400", className: "badge-superset" },
  core: { tag: "CORE", tagColor: "#00C896", className: "badge-core" },
};

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const dayKey = params.day as string;

  const [session, setSession] = useState<CurrentSession | null>(null);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Resolve "today" to actual day key
  const resolvedKey = dayKey === "today" ? getTodayWorkout().key : dayKey;
  const workout = getWorkoutByKey(resolvedKey);

  const today = new Date().toISOString().split("T")[0];

  // Initialize session
  useEffect(() => {
    if (!workout || workout.isRest) return;

    const existing = getCurrentSession();
    if (existing && existing.dayKey === resolvedKey && existing.date === today) {
      setSession(existing);
      setIsActive(true);
      setTimer(Math.floor((Date.now() - existing.startTime) / 1000));
    } else {
      const newSession: CurrentSession = {
        dayKey: resolvedKey,
        date: today,
        startTime: Date.now(),
        exercises: {},
      };
      workout.exercises?.forEach((ex) => {
        newSession.exercises[ex.id] = {
          exerciseId: ex.id,
          completed: false,
        };
      });

      // Restore if already saved today
      const record = getWorkoutRecordByDate(today, resolvedKey);
      if (record) {
        record.exercises.forEach((log) => {
          newSession.exercises[log.exerciseId] = log;
        });
        setSaved(true);
      }

      setSession(newSession);
      saveCurrentSession(newSession);
    }
  }, [resolvedKey, workout, today]);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Toggle exercise completion
  const toggleExercise = useCallback(
    (exerciseId: string) => {
      if (!session) return;
      const updated = { ...session };
      const log = updated.exercises[exerciseId];
      log.completed = !log.completed;
      setSession({ ...updated });
      saveCurrentSession(updated);
    },
    [session]
  );

  // Update exercise details
  const updateExerciseDetail = useCallback(
    (exerciseId: string, field: keyof ExerciseLog, value: number | string | undefined) => {
      if (!session) return;
      const updated = { ...session };
      (updated.exercises[exerciseId] as Record<string, unknown>)[field] = value;
      setSession({ ...updated });
      saveCurrentSession(updated);
    },
    [session]
  );

  // Save workout
  const saveWorkout = () => {
    if (!session || !workout) return;

    const exerciseLogs = Object.values(session.exercises);
    const record: WorkoutRecord = {
      id: `${session.date}-${session.dayKey}`,
      date: session.date,
      dayKey: session.dayKey,
      dayTitle: workout.title,
      exercises: exerciseLogs,
      completedCount: exerciseLogs.filter((e) => e.completed).length,
      totalCount: exerciseLogs.length,
      duration: Math.floor((Date.now() - session.startTime) / 1000),
    };

    saveWorkoutRecord(record);
    clearCurrentSession();
    setSaved(true);
    setIsActive(false);
  };

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Workout not found</p>
          <Link href="/" className="mt-2 block text-accent-blue text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Rest day
  if (workout.isRest) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-mono text-xs text-text-muted">
          ← DASHBOARD
        </Link>

        <div
          className="mb-6 rounded-2xl border p-6"
          style={{
            borderColor: `${workout.color}30`,
            background: `linear-gradient(135deg, ${workout.color}12 0%, transparent 100%)`,
          }}
        >
          <p className="font-mono text-[10px] tracking-[2px] text-text-muted">{workout.label}</p>
          <h1 className="mt-1 text-3xl font-bold" style={{ color: workout.color }}>
            {workout.icon} {workout.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{workout.subtitle}</p>
        </div>

        <div className="grid gap-3">
          {workout.recovery?.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-3 bg-surface-2 p-4 stagger-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex gap-3">
                <span className="font-mono text-[10px] font-bold text-text-dim mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed text-text-secondary">{item}</p>
              </div>
            </div>
          ))}
        </div>

        {resolvedKey === "rest-2" && (
          <Link
            href="/progress"
            className="mt-6 block rounded-xl border border-accent-blue/30 bg-accent-blue/10 p-4 text-center font-mono text-sm font-bold text-accent-blue transition-all hover:bg-accent-blue/20"
          >
            📸 LOG PROGRESS PHOTO →
          </Link>
        )}
      </div>
    );
  }

  const completedCount = session
    ? Object.values(session.exercises).filter((e) => e.completed).length
    : 0;
  const totalCount = workout.exercises?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="font-mono text-xs text-text-muted">
          ← BACK
        </Link>
        {isActive && (
          <div className="font-mono text-sm font-bold text-text-primary">
            ⏱ {formatTime(timer)}
          </div>
        )}
      </div>

      {/* Day Header */}
      <div
        className="mb-4 rounded-2xl border p-5"
        style={{
          borderColor: `${workout.color}30`,
          background: `linear-gradient(135deg, ${workout.color}12 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[2px] text-text-muted">{workout.label}</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ color: workout.color }}>
              {workout.icon} {workout.title}
            </h1>
            <p className="text-sm text-text-secondary">{workout.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-text-muted">RPE</p>
            <p className="font-mono text-xl font-extrabold">{workout.rpe}</p>
            <p className="font-mono text-[10px] text-text-muted">{workout.duration}</p>
          </div>
        </div>

        {workout.alert && (
          <div className="mt-3 rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-3 py-2 font-mono text-xs text-accent-gold">
            ⚡ {workout.alert}
          </div>
        )}

        {workout.warmup && (
          <div className="mt-3 rounded-lg bg-surface-3/50 px-3 py-2 text-xs text-text-muted">
            <span className="font-bold text-text-secondary">WARM-UP: </span>
            {workout.warmup}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4 h-1 rounded-full bg-surface-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out progress-bar-animated"
            style={{ width: `${progress}%`, background: workout.color }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
          <span>
            {completedCount}/{totalCount} exercises
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Exercises */}
      <div className="grid gap-2">
        {workout.exercises?.map((exercise, i) => {
          const meta = TYPE_META[exercise.type] || TYPE_META.isolation;
          const log = session?.exercises[exercise.id];
          const isDone = log?.completed || false;
          const isExpanded = expandedExercise === exercise.id;

          return (
            <div
              key={exercise.id}
              className="stagger-item rounded-xl border transition-all"
              style={{
                animationDelay: `${i * 40}ms`,
                borderColor: isDone ? "rgba(0,200,150,0.2)" : "rgba(255,255,255,0.04)",
                background: isDone ? "rgba(0,200,150,0.04)" : "rgba(255,255,255,0.02)",
                opacity: isDone ? 0.65 : 1,
              }}
            >
              {/* Main row */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                onClick={() => toggleExercise(exercise.id)}
              >
                {/* Checkbox */}
                <div
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                  style={{
                    border: isDone ? "2px solid #00C896" : "2px solid #333344",
                    background: isDone ? "#00C896" : "transparent",
                  }}
                >
                  {isDone && (
                    <span className="text-[11px] font-bold text-black">✓</span>
                  )}
                </div>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{
                      color: isDone ? "#55556A" : "#E8E8EC",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {exercise.name}
                  </p>
                  <div className="mt-0.5 flex gap-3 font-mono text-[10px] text-text-muted">
                    <span>{exercise.sets}</span>
                    <span>{exercise.rpe}</span>
                    <span>Rest: {exercise.rest}</span>
                  </div>
                </div>

                {/* Type badge */}
                <span
                  className="flex-shrink-0 rounded px-2 py-0.5 font-mono text-[9px] font-bold"
                  style={{
                    color: meta.tagColor,
                    background: `${meta.tagColor}10`,
                  }}
                >
                  {meta.tag}
                </span>
              </div>

              {/* Note */}
              <div className="px-4 pb-2 pl-12">
                <p className="text-[11px] italic text-text-dim">{exercise.note}</p>
              </div>

              {/* Expand for logging */}
              <div className="px-4 pb-2 pl-12">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedExercise(isExpanded ? null : exercise.id);
                  }}
                  className="font-mono text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                >
                  {isExpanded ? "▾ Hide log" : "▸ Log weight/reps"}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-surface-3 px-4 py-3 pl-12">
                  <div className="flex gap-3">
                    <div>
                      <label className="block font-mono text-[9px] text-text-muted mb-1">
                        WEIGHT (kg)
                      </label>
                      <input
                        type="number"
                        value={log?.weight || ""}
                        onChange={(e) =>
                          updateExerciseDetail(
                            exercise.id,
                            "weight",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-20 rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-blue"
                        placeholder="0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-text-muted mb-1">
                        REPS
                      </label>
                      <input
                        type="number"
                        value={log?.reps || ""}
                        onChange={(e) =>
                          updateExerciseDetail(
                            exercise.id,
                            "reps",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-16 rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-blue"
                        placeholder="0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-text-muted mb-1">
                        RPE
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={log?.rpeActual || ""}
                        onChange={(e) =>
                          updateExerciseDetail(
                            exercise.id,
                            "rpeActual",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-14 rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-blue"
                        placeholder="7"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block font-mono text-[9px] text-text-muted mb-1">
                      NOTES
                    </label>
                    <input
                      type="text"
                      value={log?.notes || ""}
                      onChange={(e) =>
                        updateExerciseDetail(exercise.id, "notes", e.target.value || undefined)
                      }
                      className="w-full rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-blue"
                      placeholder="How did this feel?"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mt-6 mb-4">
        {saved ? (
          <div className="rounded-xl border border-accent-mint/30 bg-accent-mint/10 p-4 text-center">
            <p className="font-mono text-sm font-bold text-accent-mint">
              ✓ WORKOUT SAVED
            </p>
            <p className="mt-1 font-mono text-[10px] text-text-muted">
              {completedCount}/{totalCount} exercises · {formatTime(timer)} elapsed
            </p>
          </div>
        ) : (
          <button
            onClick={saveWorkout}
            className="w-full rounded-xl py-4 font-mono text-sm font-bold tracking-wider transition-all active:scale-[0.98]"
            style={{
              background: progress === 100 ? workout.color : `${workout.color}60`,
              color: "#fff",
            }}
          >
            {progress === 100 ? "🏆 SAVE COMPLETE WORKOUT" : "💾 SAVE WORKOUT"}
          </button>
        )}
      </div>
    </div>
  );
}
