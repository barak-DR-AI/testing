import { CaptureDraft, ReviewDraft } from '@/types';

type AnalyzeApiResponse = {
  ok: boolean;
  review?: {
    title?: string;
    summary?: string;
    dueDate?: string | null;
    priority?: 'low' | 'medium' | 'high' | null;
    status?: 'Open';
  };
  transcript?: string | null;
  error?: string;
  details?: string[];
};

export async function analyzeCapture(draft: CaptureDraft, correction?: string): Promise<ReviewDraft> {
  const formData = new FormData();
  formData.set('phone', draft.phone);
  if (draft.contactName) formData.set('contactName', draft.contactName);
  if (draft.textNotes.trim()) formData.set('notes', draft.textNotes.trim());
  if (correction?.trim()) formData.set('correction', correction.trim());
  if (draft.audioFile) {
    formData.set('audio', draft.audioFile, draft.audioFile.name || draft.sourceAudioName || 'audio.webm');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as AnalyzeApiResponse;
  if (!response.ok || !data.ok || !data.review) {
    const message = data.details?.join(', ') || data.error || 'Analyze failed';
    throw new Error(message);
  }

  return {
    id: crypto.randomUUID(),
    title: data.review.title || `Follow up with ${draft.contactName || draft.phone}`,
    summary: data.review.summary || 'No summary provided.',
    dueDate: data.review.dueDate || undefined,
    priority: data.review.priority || undefined,
    status: 'Open',
    contactName: draft.contactName,
    contactPhone: draft.phone,
    transcript: data.transcript || null,
  };
}
