import dayjs from 'dayjs';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import { and, count, eq, gte, lte, sql } from 'drizzle-orm';

interface CreateGoalCompletitionRequest {
  goalId: string;
}

export async function createGoalCompletition({
  goalId,
}: CreateGoalCompletitionRequest) {
  const lastDayOfWee = dayjs().endOf('week').toDate();
  const firstDayOfWeek = dayjs().startOf('week').toDate();

  const goalCompletionCounts = db.$with('goal_completition_count').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completitionCount: count(goalCompletions.id).as('completitionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWee),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  );

  const result = await db
    .with(goalCompletionCounts)
    .select({
      id: goals.id,
      title: goals.title,
      desiredWeeklyFrequency: goals.desiredWeeklyFrenquency,
      completitionCount:
        sql`COALESCE(${goalCompletionCounts.completitionCount}, 0)`.mapWith(
          Number
        ),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1);

  const { completitionCount, desiredWeeklyFrequency } = result[0];

  if (!!desiredWeeklyFrequency && completitionCount >= desiredWeeklyFrequency)
    throw new Error('Goal already completed this week!');

  const result1 = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning();

  console.log(result1);
  return {
    goal: result1[0],
  };
}
