"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WORKOUT_DAYS, getTodayWorkout, PROGRESSION_RULES } from "@/lib/workout-data";
import { getThisWeekRecords, recalculateStats, getUserStats } from "@/lib/storage";
import { WorkoutRecord, UserStats } from "@/lib/types";

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weekRecords, setWeekRecords] = useState<WorkoutRecord[]>([]);
  const [showRules, setShowRules] = useState(false);
  const today = getTodayWorkout();

  useEffect(() => {
    async function loadData() {
      setStats(await recalculateStats());
      setWeekRecords(await getThisWeekRecords());
    }
    loadData();
  }, []);

  const weekCompletedKeys = new Set(weekRecords.map((r) => r.dayKey));

  return (
    <div className="mx-auto max-w-lg px-4 pt-12">
      {/* Brand Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold tracking-[4px] text-text-muted">
          THVMAX PERFORMANCE
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold gradient-text">
          S+ TIER PROGRAM
        </h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          5-Day Split · RPE-Governed · Auto-Regulated
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "STREAK", value: `${stats.currentStreak}`, unit: "days" },
            { label: "THIS WEEK", value: `${stats.thisWeekCompleted}`, unit: "/5" },
            { label: "TOTAL", value: `${stats.totalWorkouts}`, unit: "sessions" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-3 bg-surface-2 p-3 text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-mono text-[9px] font-bold tracking-[2px] text-text-muted">
                {s.label}
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-text-primary">
                {s.value}
              </p>
              <p className="font-mono text-[10px] text-text-muted">{s.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's Workout Card */}
      <Link href={`/workout/${today.key}`}>
        <div
          className="card-hover mb-6 rounded-2xl border p-5"
          style={{
            borderColor: `${today.color}30`,
            background: `linear-gradient(135deg, ${today.color}12 0%, ${today.color}04 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[2px] text-text-muted">
                TODAY&apos;S SESSION
              </p>
              <p className="mt-1 text-2xl font-bold" style={{ color: today.color }}>
                {today.icon} {today.title}
              </p>
              <p className="mt-0.5 text-sm text-text-secondary">{today.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-text-muted">{today.duration}</p>
              <div
                className="mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-xs font-bold"
                style={{ background: `${today.color}20`, color: today.color }}
              >
                {today.isRest ? "REST DAY" : "START →"}
              </div>
            </div>
          </div>

          {today.alert && (
            <div className="mt-3 rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-3 py-2 font-mono text-xs text-accent-gold">
              ⚡ {today.alert}
            </div>
          )}
        </div>
      </Link>

      {/* Weekly Schedule */}
      <div className="mb-6">
        <p className="mb-3 font-mono text-[10px] font-bold tracking-[3px] text-text-muted">
          WEEKLY SCHEDULE
        </p>
        <div className="grid gap-2">
          {WORKOUT_DAYS.map((day, i) => {
            const isToday = day.key === today.key;
            const isDone = weekCompletedKeys.has(day.key);

            return (
              <Link key={day.key} href={day.isRest ? "#" : `/workout/${day.key}`}>
                <div
                  className="card-hover flex items-center gap-3 rounded-xl border px-4 py-3 stagger-item"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    borderColor: isToday ? `${day.color}40` : "rgba(255,255,255,0.04)",
                    background: isToday ? `${day.color}08` : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Day badge */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold"
                    style={{
                      background: isDone ? `${day.color}20` : "rgba(255,255,255,0.04)",
                      color: isDone ? day.color : "#55556A",
                    }}
                  >
                    {isDone ? "✓" : day.day}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {day.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">{day.subtitle}</p>
                  </div>

                  {/* Duration */}
                  <p className="font-mono text-[10px] text-text-muted flex-shrink-0">
                    {day.duration}
                  </p>

                  {/* Color dot */}
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: day.color, opacity: isToday ? 1 : 0.3 }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Progression Rules */}
      <div className="mb-8">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full rounded-xl border border-surface-3 bg-surface-2 px-4 py-3 text-left font-mono text-xs font-bold tracking-wider text-text-secondary transition-all hover:bg-surface-3"
        >
          {showRules ? "▾" : "▸"} PROGRESSION & RECOVERY PROTOCOL
        </button>

        {showRules && (
          <div className="mt-2 grid gap-2">
            {PROGRESSION_RULES.map((rule, i) => (
              <div
                key={i}
                className="rounded-xl border border-surface-3 bg-surface-2 p-4 stagger-item"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-sm font-bold text-text-primary">
                  {rule.icon} {rule.rule}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {rule.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface-3 py-6 text-center">
        <p className="font-mono text-[9px] tracking-[3px] text-text-dim">
          EVERY TOUCH IS ART · THVMAX 2026
        </p>
      </div>
    </div>
  );
}
