import { NextResponse } from 'next/server';
import { env } from '@/lib/env.server';

export const runtime = 'nodejs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type N8nResponse = {
  ok?: boolean;
  review?: {
    title?: unknown;
    summary?: unknown;
    dueDate?: unknown;
    priority?: unknown;
    status?: unknown;
  };
  transcript?: unknown;
};

function normalizePriority(priority: unknown): 'low' | 'medium' | 'high' | null {
  if (priority == null) return null;
  const value = String(priority).toLowerCase();
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return null;
}

function normalizeDueDate(dueDate: unknown): string | null {
  if (dueDate == null || dueDate === '') return null;
  const value = String(dueDate);
  return DATE_RE.test(value) ? value : null;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const phone = String(formData.get('phone') || '').trim();
  const contactName = String(formData.get('contactName') || '').trim();
  const notes = String(formData.get('notes') || '').trim();
  const correction = String(formData.get('correction') || '').trim();
  const maybeAudio = formData.get('audio');
  const audio = maybeAudio instanceof File ? maybeAudio : null;

  const details: string[] = [];
  if (!phone) details.push('phone is required');
  if (!notes && !audio) details.push('at least one of notes or audio is required');

  if (details.length > 0) {
    return NextResponse.json({ ok: false, error: 'VALIDATION', details }, { status: 400 });
  }

  const forward = new FormData();
  forward.set('phone', phone);
  if (contactName) forward.set('contactName', contactName);
  if (notes) forward.set('notes', notes);
  if (correction) forward.set('correction', correction);
  if (audio) {
    const filename = audio.name || `audio.${audio.type.split('/')[1] || 'webm'}`;
    forward.set('audio', audio, filename);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(env.N8N_ANALYZE_WEBHOOK_URL, {
      method: 'POST',
      body: forward,
      signal: controller.signal,
    });

    let data: N8nResponse;
    try {
      data = (await response.json()) as N8nResponse;
    } catch {
      return NextResponse.json({ ok: false, error: 'N8N_BAD_RESPONSE' }, { status: 502 });
    }

    if (!response.ok || !data || typeof data !== 'object' || !data.review || typeof data.review !== 'object') {
      return NextResponse.json({ ok: false, error: 'N8N_BAD_RESPONSE' }, { status: 502 });
    }

    const review = {
      title: typeof data.review.title === 'string' && data.review.title.trim() ? data.review.title : `Follow up with ${phone}`,
      summary:
        typeof data.review.summary === 'string' && data.review.summary.trim()
          ? data.review.summary
          : 'No summary provided.',
      dueDate: normalizeDueDate(data.review.dueDate),
      priority: normalizePriority(data.review.priority),
      status: 'Open' as const,
    };

    return NextResponse.json({
      ok: data.ok !== false,
      review,
      transcript: typeof data.transcript === 'string' ? data.transcript : null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ ok: false, error: 'N8N_TIMEOUT' }, { status: 504 });
    }

    return NextResponse.json({ ok: false, error: 'N8N_BAD_RESPONSE' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
