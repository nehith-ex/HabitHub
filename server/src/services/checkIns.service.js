import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const asUtcDate = (value) => new Date(`${value}T00:00:00.000Z`);

export async function list(userId, query) {
  const where = { userId };
  const date = {};
  if (query.from) date.gte = asUtcDate(query.from);
  if (query.to) date.lte = asUtcDate(query.to);
  if (Object.keys(date).length) where.date = date;
  if (query.habitId) where.habitId = Number(query.habitId);

  return prisma.checkIn.findMany({
    where,
    include: {
      habit: { select: { id: true, name: true, category: true, archived: true } },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function upsert(userId, habitId, body) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new AppError('Habit not found', 404);
  if (habit.archived) throw new AppError('Archived habits cannot be tracked', 409);

  const date = asUtcDate(body.date);
  const note = (body.note == null) ? null : (body.note.trim() || null);
  return prisma.checkIn.upsert({
    where: { habitId_date: { habitId, date } },
    create: { habitId, userId, date, note },
    update: body.note === undefined ? {} : { note },
    include: { habit: { select: { id: true, name: true, category: true } } },
  });
}

export async function remove(userId, habitId, dateValue) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new AppError('Habit not found', 404);
  const result = await prisma.checkIn.deleteMany({
    where: { habitId, userId, date: asUtcDate(dateValue) },
  });
  return result.count > 0;
}
