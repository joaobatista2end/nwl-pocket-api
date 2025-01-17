import { db } from '../db';
import { goals } from '../db/schema';

interface CreateGoalRequest {
  title: string;
  desiredWeeklyFrenquency: number;
}

export async function createGoal({
  title,
  desiredWeeklyFrenquency,
}: CreateGoalRequest) {
  const result = await db
    .insert(goals)
    .values({
      title,
      desiredWeeklyFrenquency,
    })
    .returning();

  return {
    data: result[0],
  };
}
