import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const MAX_ACTIVE = 20;
const EDITABLE = ['name', 'description', 'category', 'frequency', 'targetPerWeek', 'tags', 'archived'];

const slugify = (text) => {
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'habit';
};

const pick = (object, keys) => Object.fromEntries(
  keys.filter((key) => object[key] !== undefined).map((key) => [key, object[key]])
);

export async function create(userId, body) {
  const activeCount = await prisma.habit.count({ where: { userId, archived: false } });
  if (activeCount >= MAX_ACTIVE) {
    throw new AppError('Maximum of 20 active habits reached', 403);
  }

  const data = pick(body, EDITABLE);
  return prisma.habit.create({
    data: {
      ...data,
      userId,
      slug: slugify(data.name),
      tags: data.tags || [],
    },
  });
}

export async function list(userId, query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 100, 100);
  const sort = query.sort || 'createdAt';
  const order = query.order || 'desc';
  const archived = query.archived === true || query.archived === 'true';
  const where = { userId, archived };

  if (query.category) where.category = query.category;
  if (query.q) where.name = { contains: query.q, mode: 'insensitive' };

  const [items, total] = await prisma.$transaction([
    prisma.habit.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.habit.count({ where }),
  ]);

  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getOne(userId, id) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw new AppError('Habit not found', 404);
  return habit;
}

export async function update(userId, id, body) {
  await getOne(userId, id);
  const data = pick(body, EDITABLE);
  if (Object.keys(data).length === 0) {
    throw new AppError('Provide at least one habit field to update', 400);
  }
  if (data.name) data.slug = slugify(data.name);
  return prisma.habit.update({ where: { id }, data });
}

export async function remove(userId, id) {
  await getOne(userId, id);
  await prisma.habit.delete({ where: { id } });
}
