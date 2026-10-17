// Sorties enregistrées — miroir serveur (source de vérité : appareil)
// GET    /api/plans?deviceId=...         → liste
// POST   /api/plans                      → { deviceId, plan } (upsert)
// PATCH  /api/plans                      → { deviceId, id, status }
// DELETE /api/plans?deviceId=..&id=..    → suppression
import { db } from '@/lib/db';
import { badRequest, json, safeParseArray, safeStringify } from '@/lib/server-utils';
import type { OutingPlanDraft } from '@/lib/types';

export const dynamic = 'force-dynamic';

function rowToPlan(row: any): OutingPlanDraft {
  const totals = JSON.parse(row.totals || '{}');
  const eventBonus = row.eventBonus ? JSON.parse(row.eventBonus) : undefined;
  return {
    id: row.id,
    title: row.title,
    moodKey: row.moodKey,
    moodLabel: row.moodLabel,
    dayLabel: row.dayLabel,
    timeLabel: row.timeLabel,
    budgetPerPerson: row.budgetPerPerson,
    strict: row.strict,
    peopleCount: row.peopleCount,
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
    durationLabel: row.durationLabel,
    steps: safeParseArray(row.steps) as any as OutingPlanDraft['steps'],
    totals: {
      perPerson: totals.perPerson ?? 0,
      group: totals.group ?? 0,
      transport: totals.transport ?? 0,
      safety: totals.safety ?? 0,
    },
    breakdown: safeParseArray(row.breakdown) as any as OutingPlanDraft['breakdown'],
    eventBonus,
    status: row.status === 'done' ? 'done' : 'planned',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  if (!deviceId) return badRequest('deviceId requis');
  try {
    const rows = await db.outingPlan.findMany({ where: { deviceId }, orderBy: { createdAt: 'desc' } });
    return json(rows.map(rowToPlan));
  } catch (error) {
    console.error('GET /api/plans', error);
    return json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deviceId?: string; plan?: OutingPlanDraft };
    const { deviceId, plan } = body;
    if (!deviceId || !plan?.id || !plan.title) return badRequest('deviceId et plan requis');

    const data = {
      deviceId,
      title: plan.title,
      moodKey: plan.moodKey ?? '',
      moodLabel: plan.moodLabel ?? '',
      dayLabel: plan.dayLabel ?? '',
      timeLabel: plan.timeLabel ?? '',
      budgetPerPerson: plan.budgetPerPerson ?? 0,
      strict: !!plan.strict,
      peopleCount: plan.peopleCount ?? 1,
      durationLabel: plan.durationLabel ?? '',
      steps: safeStringify(plan.steps),
      totals: safeStringify(plan.totals),
      breakdown: safeStringify(plan.breakdown),
      eventBonus: plan.eventBonus ? safeStringify(plan.eventBonus) : null,
      status: plan.status === 'done' ? 'done' : 'planned',
    };

    await db.outingPlan.upsert({
      where: { id: plan.id },
      update: data,
      create: { id: plan.id, ...data },
    });
    return json({ ok: true });
  } catch (error) {
    console.error('POST /api/plans', error);
    return json({ ok: false }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { deviceId?: string; id?: string; status?: string };
    const { deviceId, id, status } = body;
    if (!deviceId || !id || !status) return badRequest('deviceId, id, status requis');
    await db.outingPlan.updateMany({
      where: { deviceId, id },
      data: { status: status === 'done' ? 'done' : 'planned' },
    });
    return json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/plans', error);
    return json({ ok: false }, 500);
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const id = searchParams.get('id');
  if (!deviceId || !id) return badRequest('deviceId et id requis');
  try {
    await db.outingPlan.deleteMany({ where: { deviceId, id } });
    return json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/plans', error);
    return json({ ok: false }, 500);
  }
}
