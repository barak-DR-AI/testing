export type TabKey = 'capture' | 'tasks' | 'settings';

export type Contact = {
  id: string;
  name: string;
  phone: string;
};

export type CaptureDraft = {
  contactId?: string;
  contactName?: string;
  phone: string;
  textNotes: string;
  audioBlobUrl?: string;
  audioFile?: File;
  sourceAudioName?: string;
  carMode: boolean;
};

export type TaskStatus = 'Open' | 'Done' | 'Waiting' | 'Snoozed' | 'Canceled';

export type ReviewDraft = {
  id: string;
  title: string;
  summary: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status: TaskStatus;
  contactName?: string;
  contactPhone: string;
  transcript?: string | null;
};

export type Task = ReviewDraft & {
  createdAt: string;
};
