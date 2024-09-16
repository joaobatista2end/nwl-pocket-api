import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import { and, lte, sql, gte, count, eq } from 'drizzle-orm';

dayjs.extend(weekOfYear);

export async function getWeekPendingGoals() {
  const lastDayOfWee = dayjs().endOf('week').toDate();
  const firstDayOfWeek = dayjs().startOf('week').toDate();

  // Obtem os objetivos criado até essa semana
  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_weerk').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrenquency: goals.desiredWeeklyFrenquency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWee))
  );

  // Obtem os objetivos completados na semana
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
          lte(goalCompletions.createdAt, lastDayOfWee)
        )
      )
      .groupBy(goalCompletions.goalId)
  );

  // Obtem os objetivos pendentes
  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrenquency,
      completitionCount:
        sql`COALESCE(${goalCompletionCounts.completitionCount}, 0)`.mapWith(
          Number
        ),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id)
    );

  return { pendingGoals };
}
