"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkoutRecords, getUserStats, recalculateStats, exportAllData, importAllData } from "@/lib/storage";
import { WorkoutRecord, UserStats } from "@/lib/types";
import { WORKOUT_DAYS } from "@/lib/workout-data";

const DAY_COLORS: Record<string, string> = {};
WORKOUT_DAYS.forEach((d) => {
  DAY_COLORS[d.key] = d.color;
});

export default function HistoryPage() {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setRecords(getWorkoutRecords());
    setStats(recalculateStats());
  }, []);

  // Group records by week
  const groupedByWeek: Record<string, WorkoutRecord[]> = {};
  records.forEach((r) => {
    const date = new Date(r.date);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const weekKey = monday.toISOString().split("T")[0];
    if (!groupedByWeek[weekKey]) groupedByWeek[weekKey] = [];
    groupedByWeek[weekKey].push(r);
  });

  const weekKeys = Object.keys(groupedByWeek).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thvmax-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      if (importAllData(text)) {
        setRecords(getWorkoutRecords());
        setStats(recalculateStats());
        alert("Data imported successfully!");
      } else {
        alert("Import failed. Invalid file format.");
      }
    };
    input.click();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-12">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold tracking-[4px] text-text-muted">
          TRAINING LOG
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold gradient-text">
          Workout History
        </h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {records.length} sessions recorded
        </p>
      </div>

      {/* Lifetime Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            { label: "CURRENT STREAK", value: stats.currentStreak, unit: "days", color: "#E63946" },
            { label: "BEST STREAK", value: stats.longestStreak, unit: "days", color: "#FFB400" },
            { label: "TOTAL SESSIONS", value: stats.totalWorkouts, unit: "logged", color: "#457B9D" },
            { label: "MEMBER SINCE", value: new Date(stats.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }), unit: "", color: "#9B5DE5" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-3 bg-surface-2 p-4"
            >
              <p className="font-mono text-[9px] font-bold tracking-[2px] text-text-muted">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              {s.unit && (
                <p className="font-mono text-[10px] text-text-dim">{s.unit}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Weekly Records */}
      {weekKeys.length === 0 ? (
        <div className="rounded-xl border border-surface-3 bg-surface-2 p-8 text-center">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-sm text-text-muted">No workouts logged yet</p>
          <Link
            href="/workout/today"
            className="mt-3 inline-block rounded-lg bg-accent-blue/20 px-4 py-2 font-mono text-xs font-bold text-accent-blue"
          >
            START YOUR FIRST SESSION →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 mb-8">
          {weekKeys.map((weekKey) => {
            const weekRecords = groupedByWeek[weekKey];
            const weekDate = new Date(weekKey);
            const endDate = new Date(weekDate);
            endDate.setDate(endDate.getDate() + 6);
            const completionRate = Math.round((weekRecords.length / 5) * 100);

            return (
              <div key={weekKey}>
                {/* Week header */}
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-[2px] text-text-muted">
                      WEEK OF{" "}
                      {weekDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 rounded-full bg-surface-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-mint"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">
                      {weekRecords.length}/5
                    </span>
                  </div>
                </div>

                {/* Day cards */}
                <div className="grid gap-2">
                  {weekRecords.map((record) => {
                    const color = DAY_COLORS[record.dayKey] || "#6B7280";
                    const isExpanded = expandedId === record.id;

                    return (
                      <div
                        key={record.id}
                        className="rounded-xl border border-surface-3 bg-surface-2 overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        >
                          <div
                            className="h-8 w-1 rounded-full flex-shrink-0"
                            style={{ background: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">
                              {record.dayTitle}
                            </p>
                            <p className="font-mono text-[10px] text-text-muted">
                              {new Date(record.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-mono text-xs text-text-secondary">
                              {record.completedCount}/{record.totalCount}
                            </span>
                            <span className="font-mono text-[10px] text-text-dim">
                              {formatDuration(record.duration)}
                            </span>
                            <span className="text-text-dim text-xs">
                              {isExpanded ? "▾" : "▸"}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-surface-3 px-4 py-3">
                            <div className="grid gap-1.5">
                              {record.exercises.map((log) => (
                                <div
                                  key={log.exerciseId}
                                  className="flex items-center gap-2 font-mono text-xs"
                                >
                                  <span
                                    className="flex-shrink-0"
                                    style={{ color: log.completed ? "#00C896" : "#333344" }}
                                  >
                                    {log.completed ? "✓" : "○"}
                                  </span>
                                  <span
                                    className="flex-1 truncate"
                                    style={{
                                      color: log.completed ? "#8888A0" : "#55556A",
                                      textDecoration: log.completed ? "none" : "line-through",
                                    }}
                                  >
                                    {log.exerciseId.replace(/^(push|pull|upper|legs[12]?)-/, "").replace(/-/g, " ")}
                                  </span>
                                  {log.weight && (
                                    <span className="text-text-muted flex-shrink-0">
                                      {log.weight}kg
                                    </span>
                                  )}
                                  {log.reps && (
                                    <span className="text-text-dim flex-shrink-0">
                                      ×{log.reps}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Management */}
      <div className="mb-8">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full rounded-xl border border-surface-3 bg-surface-2 px-4 py-3 text-left font-mono text-xs font-bold tracking-wider text-text-muted transition-all hover:bg-surface-3"
        >
          {showExport ? "▾" : "▸"} DATA MANAGEMENT
        </button>

        {showExport && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="rounded-xl border border-surface-3 bg-surface-2 px-4 py-3 font-mono text-xs font-bold text-accent-blue transition-all hover:bg-surface-3"
            >
              📤 EXPORT DATA
            </button>
            <button
              onClick={handleImport}
              className="rounded-xl border border-surface-3 bg-surface-2 px-4 py-3 font-mono text-xs font-bold text-accent-green transition-all hover:bg-surface-3"
            >
              📥 IMPORT DATA
            </button>
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
