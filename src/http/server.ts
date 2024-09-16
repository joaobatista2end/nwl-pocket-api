import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { createGoal } from '../functions/create-goal';
import z from 'zod';
import { getWeekPendingGoals } from '../functions/get-week-pending-goals';
import { createGoalCompletition } from '../functions/create-goal-completition';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrenquency: z.number().int().min(1).max(7),
      }),
    },
  },
  async (request) => {
    const { title, desiredWeeklyFrenquency } = request.body;
    return await createGoal({ title, desiredWeeklyFrenquency });
  }
);

app.post(
  '/completition-goals',
  {
    schema: {
      body: z.object({
        goalId: z.string(),
      }),
    },
  },
  async (request) => {
    const { goalId } = request.body;
    await createGoalCompletition({ goalId });
  }
);

app.get('/pending-goals', async (request) => {
  return await getWeekPendingGoals();
});

app
  .listen({
    port: 333,
  })
  .then(() => {
    console.log('Http Server Runing');
  });
