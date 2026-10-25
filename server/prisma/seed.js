import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const user = await prisma.user.upsert({
  where: { email: 'demo@habithub.com' },
  update: {},
  create: { name: 'Demo User', email: 'demo@habithub.com' },
});

const habitDefs = [
  ['Drink water', 'health'],
  ['Morning run', 'fitness'],
  ['Read 20 pages', 'study'],
  ['Meditate', 'mindfulness'],
  ['Journal', 'other'],
];

// Seed habits
const habits = [];
for (const [name, category] of habitDefs) {
  const existing = await prisma.habit.findFirst({ where: { userId: user.id, name } });
  const habit = existing || await prisma.habit.create({
    data: { userId: user.id, name, category, slug: slugify(name), tags: [category] },
  });
  habits.push(habit);
}

// ── Last 7 days: each day has a DIFFERENT random pattern ──────────────────
// dayMasks[i] = which habits are completed on day (today - i)
// Each day is unique so the calendar shows varied data across the week
const dayMasks = [
  [true,  true,  true,  true,  true],   // today     – all 5 done
  [true,  false, true,  false, true],   // yesterday – 3 done
  [true,  true,  false, true,  false],  // 2 days ago – 3 done
  [false, true,  true,  true,  false],  // 3 days ago – 3 done
  [true,  false, false, true,  true],   // 4 days ago – 3 done
  [false, false, true,  false, true],   // 5 days ago – 2 done
  [true,  true,  false, false, true],   // 6 days ago – 3 done
];

for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dayOffset);

  const mask = dayMasks[dayOffset];
  for (let hi = 0; hi < habits.length; hi++) {
    if (mask[hi]) {
      await prisma.checkIn.upsert({
        where: { habitId_date: { habitId: habits[hi].id, date: d } },
        update: {},
        create: { habitId: habits[hi].id, userId: user.id, date: d },
      });
    }
  }
}

// Also keep some older history (past 30 days) so streaks look good
for (const [index, habit] of habits.entries()) {
  const data = [];
  for (let i = 7; i < 30; i++) {
    if ((i * 7 + index * 11) % 10 < 7) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      data.push({ habitId: habit.id, userId: user.id, date: d });
    }
  }
  if (data.length) await prisma.checkIn.createMany({ data, skipDuplicates: true });
}

console.log('✅ Seeded 7 days of varied check-in data. User id:', user.id);
await prisma.$disconnect();
