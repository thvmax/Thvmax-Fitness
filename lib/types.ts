export interface Exercise {
  id: string;
  name: string;
  sets: string;
  rpe: string;
  rest: string;
  note: string;
  type: "compound" | "isolation" | "superset-a" | "superset-b" | "core";
}

export interface WorkoutDay {
  key: string;
  dayIndex: number;
  day: string;
  label: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  rpe: string;
  duration: string;
  warmup: string;
  alert?: string;
  isRest?: boolean;
  recovery?: string[];
  exercises?: Exercise[];
}

export interface ExerciseLog {
  exerciseId: string;
  completed: boolean;
  weight?: number;
  reps?: number;
  rpeActual?: number;
  notes?: string;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  dayKey: string;
  dayTitle: string;
  exercises: ExerciseLog[];
  completedCount: number;
  totalCount: number;
  duration?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
}

export interface ProgressEntry {
  id: string;
  date: string;
  week: number;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  workoutsCompleted: number;
  workoutsPlanned: number;
  totalExercises: number;
  completionRate: number;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  thisWeekCompleted: number;
  joinDate: string;
}
