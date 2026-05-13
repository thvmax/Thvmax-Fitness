"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getProgressEntries,
  saveProgressEntry,
  deleteProgressEntry,
  savePhoto,
  getPhoto,
  compressImage,
} from "@/lib/storage";
import { ProgressEntry } from "@/lib/types";

type PhotoSlot = "front" | "side" | "back";

interface PhotoPreviews {
  front: string | null;
  side: string | null;
  back: string | null;
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [photos, setPhotos] = useState<PhotoPreviews>({ front: null, side: null, back: null });
  const [measurements, setMeasurements] = useState({
    weight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    arms: "",
    thighs: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<string | null>(null);
  const [viewPhotos, setViewPhotos] = useState<PhotoPreviews>({ front: null, side: null, back: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<PhotoSlot>("front");

  useEffect(() => {
    setEntries(getProgressEntries());
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1200, 0.8);
      setPhotos((prev) => ({ ...prev, [activeSlot]: compressed }));
    } catch (err) {
      console.error("Photo compression failed:", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerUpload = (slot: PhotoSlot) => {
    setActiveSlot(slot);
    fileInputRef.current?.click();
  };

  const getWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const handleSave = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const id = `progress-${today}`;

    // Save photos to IndexedDB
    if (photos.front) await savePhoto(`${id}-front`, photos.front);
    if (photos.side) await savePhoto(`${id}-side`, photos.side);
    if (photos.back) await savePhoto(`${id}-back`, photos.back);

    const entry: ProgressEntry = {
      id,
      date: today,
      week: getWeekNumber(),
      photoFront: photos.front ? `${id}-front` : undefined,
      photoSide: photos.side ? `${id}-side` : undefined,
      photoBack: photos.back ? `${id}-back` : undefined,
      weight: measurements.weight ? Number(measurements.weight) : undefined,
      bodyFat: measurements.bodyFat ? Number(measurements.bodyFat) : undefined,
      chest: measurements.chest ? Number(measurements.chest) : undefined,
      waist: measurements.waist ? Number(measurements.waist) : undefined,
      arms: measurements.arms ? Number(measurements.arms) : undefined,
      thighs: measurements.thighs ? Number(measurements.thighs) : undefined,
      notes: measurements.notes || undefined,
    };

    saveProgressEntry(entry);
    setEntries(getProgressEntries());
    setPhotos({ front: null, side: null, back: null });
    setMeasurements({ weight: "", bodyFat: "", chest: "", waist: "", arms: "", thighs: "", notes: "" });
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleViewEntry = async (entry: ProgressEntry) => {
    if (viewingEntry === entry.id) {
      setViewingEntry(null);
      setViewPhotos({ front: null, side: null, back: null });
      return;
    }

    setViewingEntry(entry.id);
    const vp: PhotoPreviews = { front: null, side: null, back: null };

    if (entry.photoFront) vp.front = await getPhoto(entry.photoFront);
    if (entry.photoSide) vp.side = await getPhoto(entry.photoSide);
    if (entry.photoBack) vp.back = await getPhoto(entry.photoBack);

    setViewPhotos(vp);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this progress entry?")) return;
    deleteProgressEntry(id);
    setEntries(getProgressEntries());
    if (viewingEntry === id) {
      setViewingEntry(null);
      setViewPhotos({ front: null, side: null, back: null });
    }
  };

  const hasAnyPhoto = photos.front || photos.side || photos.back;
  const hasAnyMeasurement = Object.values(measurements).some((v) => v !== "");

  return (
    <div className="mx-auto max-w-lg px-4 pt-12">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold tracking-[4px] text-text-muted">
          BODY TRACKING
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold gradient-text">
          Progress Journal
        </h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          Weekly photos & measurements · Week {getWeekNumber()}
        </p>
      </div>

      {/* Photo Upload Section */}
      <div className="mb-6">
        <p className="mb-3 font-mono text-[10px] font-bold tracking-[3px] text-text-muted">
          📸 PROGRESS PHOTOS
        </p>

        <div className="grid grid-cols-3 gap-3">
          {(["front", "side", "back"] as PhotoSlot[]).map((slot) => (
            <button
              key={slot}
              onClick={() => triggerUpload(slot)}
              className="aspect-[3/4] rounded-xl border-2 border-dashed transition-all overflow-hidden"
              style={{
                borderColor: photos[slot]
                  ? "rgba(69,123,157,0.5)"
                  : "rgba(255,255,255,0.08)",
                background: photos[slot]
                  ? "transparent"
                  : "rgba(255,255,255,0.02)",
              }}
            >
              {photos[slot] ? (
                <img
                  src={photos[slot]!}
                  alt={slot}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#55556A"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="font-mono text-[10px] font-bold uppercase text-text-dim">
                    {slot}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Measurements */}
      <div className="mb-6">
        <p className="mb-3 font-mono text-[10px] font-bold tracking-[3px] text-text-muted">
          📏 MEASUREMENTS
        </p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "weight", label: "WEIGHT", unit: "kg", icon: "⚖️" },
            { key: "bodyFat", label: "BODY FAT", unit: "%", icon: "📊" },
            { key: "chest", label: "CHEST", unit: "cm", icon: "📐" },
            { key: "waist", label: "WAIST", unit: "cm", icon: "📐" },
            { key: "arms", label: "ARMS", unit: "cm", icon: "💪" },
            { key: "thighs", label: "THIGHS", unit: "cm", icon: "🦵" },
          ].map((field) => (
            <div
              key={field.key}
              className="rounded-xl border border-surface-3 bg-surface-2 p-3"
            >
              <label className="block font-mono text-[9px] font-bold tracking-wider text-text-muted mb-1.5">
                {field.icon} {field.label}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={measurements[field.key as keyof typeof measurements]}
                  onChange={(e) =>
                    setMeasurements((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent-blue"
                  placeholder="—"
                />
                <span className="font-mono text-[10px] text-text-muted flex-shrink-0">
                  {field.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-3 rounded-xl border border-surface-3 bg-surface-2 p-3">
          <label className="block font-mono text-[9px] font-bold tracking-wider text-text-muted mb-1.5">
            📝 WEEKLY NOTES
          </label>
          <textarea
            value={measurements.notes}
            onChange={(e) =>
              setMeasurements((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={2}
            className="w-full resize-none rounded-lg border border-surface-4 bg-surface-3 px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-blue"
            placeholder="Energy levels, sleep quality, how clothes fit..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mb-8">
        {justSaved ? (
          <div className="rounded-xl border border-accent-mint/30 bg-accent-mint/10 p-4 text-center">
            <p className="font-mono text-sm font-bold text-accent-mint">
              ✓ PROGRESS SAVED — WEEK {getWeekNumber()}
            </p>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || (!hasAnyPhoto && !hasAnyMeasurement)}
            className="w-full rounded-xl bg-accent-blue py-4 font-mono text-sm font-bold tracking-wider text-white transition-all active:scale-[0.98] disabled:opacity-30"
          >
            {saving ? "SAVING..." : "📸 SAVE PROGRESS ENTRY"}
          </button>
        )}
      </div>

      {/* History */}
      <div className="mb-8">
        <p className="mb-3 font-mono text-[10px] font-bold tracking-[3px] text-text-muted">
          📅 PROGRESS HISTORY
        </p>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-surface-3 bg-surface-2 p-6 text-center">
            <p className="text-sm text-text-muted">No entries yet</p>
            <p className="mt-1 font-mono text-[10px] text-text-dim">
              Upload your first progress photo above
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-surface-3 bg-surface-2 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => handleViewEntry(entry)}
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Week {entry.week}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {entry.photoFront && <div className="h-2 w-2 rounded-full bg-accent-blue" />}
                      {entry.photoSide && <div className="h-2 w-2 rounded-full bg-accent-green" />}
                      {entry.photoBack && <div className="h-2 w-2 rounded-full bg-accent-purple" />}
                    </div>
                    {entry.weight && (
                      <span className="font-mono text-xs text-text-secondary">
                        {entry.weight}kg
                      </span>
                    )}
                    <span className="text-text-muted text-xs">
                      {viewingEntry === entry.id ? "▾" : "▸"}
                    </span>
                  </div>
                </div>

                {viewingEntry === entry.id && (
                  <div className="border-t border-surface-3 p-4">
                    {/* Photos */}
                    {(viewPhotos.front || viewPhotos.side || viewPhotos.back) && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {(["front", "side", "back"] as PhotoSlot[]).map(
                          (slot) =>
                            viewPhotos[slot] && (
                              <div key={slot} className="aspect-[3/4] rounded-lg overflow-hidden">
                                <img
                                  src={viewPhotos[slot]!}
                                  alt={`${slot} - ${entry.date}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )
                        )}
                      </div>
                    )}

                    {/* Measurements */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Weight", val: entry.weight, unit: "kg" },
                        { label: "Body Fat", val: entry.bodyFat, unit: "%" },
                        { label: "Chest", val: entry.chest, unit: "cm" },
                        { label: "Waist", val: entry.waist, unit: "cm" },
                        { label: "Arms", val: entry.arms, unit: "cm" },
                        { label: "Thighs", val: entry.thighs, unit: "cm" },
                      ]
                        .filter((m) => m.val)
                        .map((m) => (
                          <div key={m.label} className="text-center">
                            <p className="font-mono text-[9px] text-text-muted">{m.label}</p>
                            <p className="font-mono text-sm font-bold text-text-primary">
                              {m.val}
                              <span className="text-text-muted text-[10px]">{m.unit}</span>
                            </p>
                          </div>
                        ))}
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-text-muted italic mb-3">{entry.notes}</p>
                    )}

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="font-mono text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Delete entry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
