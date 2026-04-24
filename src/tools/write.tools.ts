import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GarminClient } from '../client/index.js';
import {
  setActivityNameSchema,
  createManualActivitySchema,
  deleteActivitySchema,
  addWeighInSchema,
  setHydrationSchema,
  setBloodPressureSchema,
  gearActivitySchema,
  uploadWorkoutSchema,
  scheduleWorkoutSchema,
  deleteWorkoutSchema,
  unscheduleWorkoutSchema,
  createStructuredWorkoutSchema,
} from '../dtos/index.js';

export function registerWriteTools(server: McpServer, client: GarminClient): void {
  server.registerTool(
    'create_structured_workout',
    {
      description:
        'Create a Garmin workout from a simplified schema (name, sport, timed steps, optional zones/targets). Use this instead of raw upload_workout for most cases.',
      inputSchema: createStructuredWorkoutSchema.shape,
    },
    async ({ workoutName, description, sportTypeKey, steps }) => {
      const resolvedSport = sportTypeKey ?? 'running';
      const sportTypeMeta: Record<'running' | 'cycling' | 'swimming', { sportTypeId: number; displayOrder: number }> =
        {
          running: { sportTypeId: 1, displayOrder: 1 },
          cycling: { sportTypeId: 2, displayOrder: 2 },
          swimming: { sportTypeId: 5, displayOrder: 5 },
        };
      const sport = sportTypeMeta[resolvedSport];

      const workoutData: Record<string, unknown> = {
        workoutName,
        description: description ?? null,
        sportType: {
          sportTypeId: sport.sportTypeId,
          sportTypeKey: resolvedSport,
          displayOrder: sport.displayOrder,
        },
        subSportType: null,
        estimatedDistanceUnit: { unitKey: null },
        estimatedDurationInSecs: steps.reduce((acc, step) => acc + step.durationSeconds, 0),
        estimatedDistanceInMeters: 0,
        estimateType: null,
        avgTrainingSpeed: 0,
        isWheelchair: false,
        workoutSegments: [
          {
            segmentOrder: 1,
            sportType: {
              sportTypeId: sport.sportTypeId,
              sportTypeKey: resolvedSport,
              displayOrder: sport.displayOrder,
            },
            workoutSteps: steps.map((step, index) => {
              const baseStep: Record<string, unknown> = {
                stepOrder: index + 1,
                stepType: { stepTypeKey: step.stepTypeKey },
                durationType: { durationTypeKey: 'time' },
                durationValue: step.durationSeconds,
                targetType: { workoutTargetTypeKey: step.targetTypeKey ?? 'no.target' },
              };
              if (step.zoneNumber !== undefined) baseStep.zoneNumber = step.zoneNumber;
              if (step.targetValueOne !== undefined) baseStep.targetValueOne = step.targetValueOne;
              if (step.targetValueTwo !== undefined) baseStep.targetValueTwo = step.targetValueTwo;
              if (step.description) baseStep.description = step.description;
              return baseStep;
            }),
          },
        ],
      };

      const data = await client.uploadWorkout(workoutData);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'upload_workout',
    {
      description:
        'Upload a raw Garmin workout JSON payload (expert mode). Prefer create_structured_workout unless you need full Garmin payload control.',
      inputSchema: uploadWorkoutSchema.shape,
    },
    async ({ workoutData }) => {
      const data = await client.uploadWorkout(workoutData);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'upload_running_workout',
    {
      description:
        'Upload a running workout. Adds sportTypeKey=running to payload when missing',
      inputSchema: uploadWorkoutSchema.shape,
    },
    async ({ workoutData }) => {
      const data = await client.uploadRunningWorkout(workoutData);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'upload_cycling_workout',
    {
      description:
        'Upload a cycling workout. Adds sportTypeKey=cycling to payload when missing',
      inputSchema: uploadWorkoutSchema.shape,
    },
    async ({ workoutData }) => {
      const data = await client.uploadCyclingWorkout(workoutData);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'upload_swimming_workout',
    {
      description:
        'Upload a swimming workout. Adds sportTypeKey=swimming to payload when missing',
      inputSchema: uploadWorkoutSchema.shape,
    },
    async ({ workoutData }) => {
      const data = await client.uploadSwimmingWorkout(workoutData);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'schedule_workout',
    {
      description: 'Schedule an existing workout on a calendar date (YYYY-MM-DD)',
      inputSchema: scheduleWorkoutSchema.shape,
    },
    async ({ workoutId, date }) => {
      const data = await client.scheduleWorkout(workoutId, date);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'delete_workout',
    {
      description: 'Delete a workout permanently. This action cannot be undone',
      inputSchema: deleteWorkoutSchema.shape,
    },
    async ({ workoutId }) => {
      const data = await client.deleteWorkout(workoutId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data ?? 'Workout deleted', null, 2) }],
      };
    },
  );

  server.registerTool(
    'unschedule_workout',
    {
      description: 'Remove a scheduled workout entry from calendar',
      inputSchema: unscheduleWorkoutSchema.shape,
    },
    async ({ scheduledWorkoutId }) => {
      const data = await client.unscheduleWorkout(scheduledWorkoutId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data ?? 'Scheduled workout removed', null, 2) }],
      };
    },
  );

  server.registerTool(
    'set_activity_name',
    {
      description: 'Rename an activity',
      inputSchema: setActivityNameSchema.shape,
    },
    async ({ activityId, name }) => {
      const data = await client.setActivityName(activityId, name);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'create_manual_activity',
    {
      description:
        'Create a manual activity entry. Use get_activity_types to find valid activityTypeKey values',
      inputSchema: createManualActivitySchema.shape,
    },
    async ({ activityName, activityTypeKey, startTimeInGMT, elapsedDurationInSecs, distanceInMeters }) => {
      const data = await client.createManualActivity({
        activityName,
        activityTypeKey,
        startTimeInGMT,
        elapsedDurationInSecs,
        distanceInMeters,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'delete_activity',
    {
      description: 'Delete an activity permanently. This action cannot be undone',
      inputSchema: deleteActivitySchema.shape,
    },
    async ({ activityId }) => {
      const data = await client.deleteActivity(activityId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data ?? 'Activity deleted', null, 2) }],
      };
    },
  );

  server.registerTool(
    'add_weigh_in',
    {
      description: 'Record a weight measurement',
      inputSchema: addWeighInSchema.shape,
    },
    async ({ weight, unitKey, date }) => {
      const data = await client.addWeighIn(weight, unitKey ?? 'kg', date);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'set_hydration',
    {
      description: 'Set daily hydration intake in milliliters',
      inputSchema: setHydrationSchema.shape,
    },
    async ({ valueMl, date }) => {
      const data = await client.setHydration(valueMl, date);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'set_blood_pressure',
    {
      description: 'Record a blood pressure measurement with systolic, diastolic, and pulse',
      inputSchema: setBloodPressureSchema.shape,
    },
    async ({ systolic, diastolic, pulse, timestamp, notes }) => {
      const data = await client.setBloodPressure(systolic, diastolic, pulse, timestamp, notes);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerTool(
    'add_gear_to_activity',
    {
      description: 'Link a gear item (shoes, bike) to an activity',
      inputSchema: gearActivitySchema.shape,
    },
    async ({ gearUuid, activityId }) => {
      const data = await client.addGearToActivity(gearUuid, activityId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data ?? 'Gear linked', null, 2) }],
      };
    },
  );

  server.registerTool(
    'remove_gear_from_activity',
    {
      description: 'Unlink a gear item from an activity',
      inputSchema: gearActivitySchema.shape,
    },
    async ({ gearUuid, activityId }) => {
      const data = await client.removeGearFromActivity(gearUuid, activityId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data ?? 'Gear unlinked', null, 2) }],
      };
    },
  );
}
