import { z } from 'zod';
import { dateString } from '../constants/index.js';

export type SetActivityNameDto = {
  activityId: number;
  name: string;
};

export const setActivityNameSchema = z.object({
  activityId: z.number().positive().describe('The Garmin activity ID'),
  name: z.string().describe('New name for the activity'),
});

export type CreateManualActivityDto = {
  activityName: string;
  activityTypeKey: string;
  startTimeInGMT: string;
  elapsedDurationInSecs: number;
  distanceInMeters?: number;
};

export const createManualActivitySchema = z.object({
  activityName: z.string().describe('Name for the activity (e.g. "Morning Run")'),
  activityTypeKey: z.string().describe('Activity type key (e.g. running, cycling, swimming). Use get_activity_types to see all options'),
  startTimeInGMT: z
    .string()
    .describe('Start time in ISO 8601 format in GMT (e.g. "2024-01-15T08:30:00.000")'),
  elapsedDurationInSecs: z.number().positive().describe('Duration in seconds'),
  distanceInMeters: z.number().min(0).optional().describe('Distance in meters. Optional'),
});

export type DeleteActivityDto = {
  activityId: number;
};

export const deleteActivitySchema = z.object({
  activityId: z.number().positive().describe('The Garmin activity ID to delete'),
});

export type AddWeighInDto = {
  weight: number;
  unitKey?: string;
  date?: string;
};

export const addWeighInSchema = z.object({
  weight: z.number().positive().max(700).describe('Weight value'),
  unitKey: z
    .enum(['kg', 'lbs'])
    .default('kg')
    .optional()
    .describe('Weight unit: kg or lbs. Defaults to kg'),
  date: dateString.optional().describe('Date in YYYY-MM-DD format. Defaults to today'),
});

export type SetHydrationDto = {
  date?: string;
  valueMl: number;
};

export const setHydrationSchema = z.object({
  date: dateString.optional().describe('Date in YYYY-MM-DD format. Defaults to today'),
  valueMl: z.number().min(0).max(20000).describe('Hydration value in milliliters'),
});

export type SetBloodPressureDto = {
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp?: string;
  notes?: string;
};

export const setBloodPressureSchema = z.object({
  systolic: z.number().positive().max(300).describe('Systolic pressure (mmHg)'),
  diastolic: z.number().positive().max(200).describe('Diastolic pressure (mmHg)'),
  pulse: z.number().positive().max(300).describe('Pulse rate (bpm)'),
  timestamp: z
    .string()
    .optional()
    .describe('Measurement timestamp in ISO 8601 format. Defaults to now'),
  notes: z.string().optional().describe('Optional notes about the measurement'),
});

export type GearActivityDto = {
  gearUuid: string;
  activityId: number;
};

export const gearActivitySchema = z.object({
  gearUuid: z.string().uuid().describe('The UUID of the gear item'),
  activityId: z.number().positive().describe('The Garmin activity ID'),
});

export type UploadWorkoutDto = {
  workoutData: Record<string, unknown>;
};

export const uploadWorkoutSchema = z.object({
  workoutData: z
    .record(z.string(), z.any())
    .describe('Garmin workout payload JSON (structured workout definition)'),
});

export type ScheduleWorkoutDto = {
  workoutId: string;
  date: string;
};

export const scheduleWorkoutSchema = z.object({
  workoutId: z.string().describe('The Garmin workout ID to add to the calendar'),
  date: dateString.describe('Date in YYYY-MM-DD format'),
});

export type DeleteWorkoutDto = {
  workoutId: string;
};

export const deleteWorkoutSchema = z.object({
  workoutId: z.string().describe('The Garmin workout ID to delete permanently'),
});

export type UnscheduleWorkoutDto = {
  scheduledWorkoutId: string;
};

export const unscheduleWorkoutSchema = z.object({
  scheduledWorkoutId: z.string().describe('The scheduled workout ID (calendar entry) to remove'),
});

export type CreateStructuredWorkoutDto = {
  workoutName: string;
  description?: string;
  sportTypeKey?: 'running' | 'cycling' | 'swimming';
  steps: Array<{
    stepTypeKey: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'rest';
    durationSeconds: number;
    targetTypeKey?: 'no.target' | 'heart.rate.zone' | 'power.zone' | 'pace.zone' | 'speed.zone' | 'cadence';
    zoneNumber?: number;
    targetValueOne?: number;
    targetValueTwo?: number;
    description?: string;
  }>;
};

const structuredWorkoutStepSchema = z.object({
  stepTypeKey: z
    .enum(['warmup', 'interval', 'recovery', 'cooldown', 'rest'])
    .describe('Workout step type'),
  durationSeconds: z.number().positive().describe('Step duration in seconds'),
  targetTypeKey: z
    .enum(['no.target', 'heart.rate.zone', 'power.zone', 'pace.zone', 'speed.zone', 'cadence'])
    .default('no.target')
    .optional()
    .describe('Target mode for the step'),
  zoneNumber: z.number().int().positive().max(10).optional().describe('Optional zone number (e.g. HR zone 2)'),
  targetValueOne: z.number().optional().describe('Optional lower target bound'),
  targetValueTwo: z.number().optional().describe('Optional upper target bound'),
  description: z.string().optional().describe('Optional step note'),
});

export const createStructuredWorkoutSchema = z.object({
  workoutName: z.string().min(1).describe('Workout name'),
  description: z.string().optional().describe('Optional workout description'),
  sportTypeKey: z
    .enum(['running', 'cycling', 'swimming'])
    .default('running')
    .optional()
    .describe('Sport type'),
  steps: z.array(structuredWorkoutStepSchema).min(1).describe('Ordered list of workout steps'),
});
