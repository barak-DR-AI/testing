import { CaptureDraft, ReviewDraft } from '@/types';

const priorities: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

export function generateReview(draft: CaptureDraft, fixNote?: string): ReviewDraft {
  const now = new Date();
  const due = new Date(now);
  due.setDate(now.getDate() + 1);
  const priority = priorities[(draft.phone.length + draft.textNotes.length) % priorities.length];

  const summaryBase = draft.textNotes.trim() || `Audio note received from ${draft.contactName || draft.phone}`;
  const summary = fixNote
    ? `${summaryBase} (Adjusted after feedback: ${fixNote.trim()})`
    : summaryBase;

  return {
    id: crypto.randomUUID(),
    title: `Follow up with ${draft.contactName || draft.phone}`,
    summary,
    dueDate: due.toISOString(),
    priority,
    status: 'Open',
    contactName: draft.contactName,
    contactPhone: draft.phone,
  };
}
