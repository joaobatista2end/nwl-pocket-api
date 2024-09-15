import { client, db } from '.';
import { goalCompletions, goals } from './schema';
import dayjs from 'dayjs';

async function seed() {
  await db.delete(goalCompletions);
  await db.delete(goals);

  const goalsRegisters = await db
    .insert(goals)
    .values([
      {
        title: 'Acordar cedo',
        desiredWeeklyFrequencyL: 5,
      },
      {
        title: 'Meditar',
        desiredWeeklyFrequencyL: 1,
      },
    ])
    .returning();

  const startOfWeek = dayjs().startOf('week');

  await db.insert(goalCompletions).values([
    {
      goalId: goalsRegisters[0].id,
      createdAt: startOfWeek.toDate(),
    },
    {
      goalId: goalsRegisters[0].id,
      createdAt: startOfWeek.add(1, 'day').toDate(),
    },
  ]);
}

seed().finally(() => {
  client.end();
});
