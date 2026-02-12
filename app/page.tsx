'use client';

import { useEffect, useMemo, useState } from 'react';
import { PinLock } from '@/components/PinLock';
import { Recorder } from '@/components/Recorder';
import { ReviewCard } from '@/components/ReviewCard';
import { TabBar } from '@/components/TabBar';
import { analyzeCapture } from '@/lib/analyzeClient';
import { MOCK_CONTACTS } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { CaptureDraft, Contact, ReviewDraft, TabKey, Task } from '@/types';

const defaultCapture: CaptureDraft = {
  phone: '',
  textNotes: '',
  carMode: false,
};

function filterTasks(tasks: Task[], filter: 'Today' | 'This Week' | 'Overdue' | 'All') {
  const now = new Date();
  if (filter === 'All') return tasks;

  return tasks.filter((task) => {
    if (!task.dueDate) return filter === 'This Week';
    const due = new Date(task.dueDate);
    if (filter === 'Today') return due.toDateString() === now.toDateString();
    if (filter === 'Overdue') return due < now && task.status !== 'Done';
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);
    return due >= now && due <= weekFromNow;
  });
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('capture');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [draft, setDraft] = useState<CaptureDraft>(defaultCapture);
  const [review, setReview] = useState<ReviewDraft | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [fixText, setFixText] = useState('');
  const [taskFilter, setTaskFilter] = useState<'Today' | 'This Week' | 'Overdue' | 'All'>('All');
  const [changePinMode, setChangePinMode] = useState(false);
  const [defaultSoundEnabled, setDefaultSoundEnabled] = useState(true);

  useEffect(() => {
    setTasks(storage.getTasks());
    setDefaultSoundEnabled(storage.getDefaultSoundEnabled());
  }, []);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return MOCK_CONTACTS;
    const query = search.toLowerCase();
    return MOCK_CONTACTS.filter(
      (contact) => contact.name.toLowerCase().includes(query) || contact.phone.toLowerCase().includes(query),
    );
  }, [search]);

  const filteredTasks = useMemo(() => filterTasks(tasks, taskFilter), [tasks, taskFilter]);

  function pickContact(contact: Contact) {
    setDraft((prev) => ({ ...prev, contactId: contact.id, contactName: contact.name, phone: contact.phone }));
  }

  function updateStatus(id: string, status: Task['status']) {
    const updated = tasks.map((task) => (task.id === id ? { ...task, status } : task));
    setTasks(updated);
    storage.setTasks(updated);
  }

  function validateCapture() {
    const nextErrors: string[] = [];
    if (!draft.phone.trim()) nextErrors.push('Phone is required.');
    if (!draft.textNotes.trim() && !draft.audioFile) {
      nextErrors.push('At least one of text notes or audio is required.');
    }
    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  async function analyze(correction?: string) {
    if (!validateCapture()) return;
    setAnalyzeError(null);
    setIsAnalyzing(true);

    try {
      const nextReview = await analyzeCapture(draft, correction);
      setReview(nextReview);
      setShowFix(false);
      setFixText('');
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : 'Analyze failed');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function approveAndSave() {
    if (!review) return;
    const task: Task = { ...review, transcript: null, createdAt: new Date().toISOString() };
    const updated = [task, ...tasks];
    setTasks(updated);
    storage.setTasks(updated);
    setActiveTab('tasks');
    setReview(null);
    setDraft(defaultCapture);
  }

  function clearTasks() {
    if (!window.confirm('Clear all tasks? This cannot be undone.')) return;
    setTasks([]);
    storage.clearTasks();
  }

  const locked = !isUnlocked;

  return (
    <main className="app-shell">
      <header className="header">
        <h1>Capture → Review → Tasks</h1>
      </header>

      {locked ? (
        <PinLock unlocked={isUnlocked} onUnlock={() => setIsUnlocked(true)} />
      ) : (
        <section className="content">
          {activeTab === 'capture' && (
            <>
              {!review ? (
                <section className="card">
                  <div className="row between">
                    <h2>New Capture</h2>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, carMode: !prev.carMode }))}
                    >
                      Car Mode: {draft.carMode ? 'On' : 'Off'}
                    </button>
                  </div>

                  <label className="field-label">Find Contact</label>
                  <input
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <div className="contact-list">
                    {filteredContacts.map((contact) => (
                      <button className="contact-item" key={contact.id} onClick={() => pickContact(contact)} type="button">
                        <span>{contact.name}</span>
                        <small>{contact.phone}</small>
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Phone</label>
                  <input
                    inputMode="tel"
                    placeholder="Enter phone"
                    value={draft.phone}
                    onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
                  />

                  {!draft.carMode && (
                    <>
                      <label className="field-label">Text Notes</label>
                      <textarea
                        rows={4}
                        placeholder="What happened?"
                        value={draft.textNotes}
                        onChange={(event) => setDraft((prev) => ({ ...prev, textNotes: event.target.value }))}
                      />
                    </>
                  )}

                  <Recorder
                    compact={draft.carMode}
                    onAudioReady={({ url, file, sourceName }) =>
                      setDraft((prev) => ({ ...prev, audioBlobUrl: url, audioFile: file, sourceAudioName: sourceName }))
                    }
                  />

                  {draft.carMode && <label className="field-label">Quick Note</label>}
                  {draft.carMode && (
                    <textarea
                      rows={2}
                      placeholder="Optional quick note"
                      value={draft.textNotes}
                      onChange={(event) => setDraft((prev) => ({ ...prev, textNotes: event.target.value }))}
                    />
                  )}

                  {errors.length > 0 && (
                    <ul className="errors">
                      {errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  )}
                  {analyzeError && <p className="errors">{analyzeError}</p>}

                  <button disabled={isAnalyzing} onClick={() => analyze()} type="button">
                    {isAnalyzing ? 'Analyzing…' : 'Analyze'}
                  </button>
                </section>
              ) : (
                <section>
                  <h2>Review</h2>
                  <ReviewCard review={review} />
                  {!showFix ? (
                    <div className="row wrap">
                      <button onClick={approveAndSave} type="button">
                        Approve &amp; Save
                      </button>
                      <button className="secondary" onClick={() => setShowFix(true)} type="button">
                        Needs Fix
                      </button>
                    </div>
                  ) : (
                    <div className="card">
                      <label className="field-label">What to fix?</label>
                      <textarea value={fixText} onChange={(event) => setFixText(event.target.value)} rows={3} />
                      {analyzeError && <p className="errors">{analyzeError}</p>}
                      <div className="row">
                        <button disabled={isAnalyzing} onClick={() => analyze(fixText)} type="button">
                          {isAnalyzing ? 'Re-analyzing…' : 'Re-analyze'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {activeTab === 'tasks' && (
            <section>
              <h2>Tasks</h2>
              <div className="row wrap">
                {(['Today', 'This Week', 'Overdue', 'All'] as const).map((filter) => (
                  <button
                    className={taskFilter === filter ? '' : 'secondary'}
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    type="button"
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="stack">
                {filteredTasks.map((task) => (
                  <article className="card" key={task.id}>
                    <h3>{task.title}</h3>
                    <p>{task.summary}</p>
                    <p className="muted">
                      {task.contactName || 'Unknown'} · {task.contactPhone}
                    </p>
                    <p className="muted">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'None'} · Priority:{' '}
                      {task.priority || 'None'}
                    </p>
                    <div className="row wrap">
                      <select value={task.status} onChange={(event) => updateStatus(task.id, event.target.value as Task['status'])}>
                        {['Open', 'Done', 'Waiting', 'Snoozed', 'Canceled'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <a className="button-link" href={`tel:${task.contactPhone}`}>
                        Call
                      </a>
                      <button className="secondary" onClick={() => updateStatus(task.id, 'Done')} type="button">
                        Mark Done
                      </button>
                    </div>
                  </article>
                ))}
                {filteredTasks.length === 0 && <p className="muted">No tasks in this filter.</p>}
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="stack">
              <h2>Settings</h2>
              {!changePinMode ? (
                <button onClick={() => setChangePinMode(true)} type="button">
                  Change PIN
                </button>
              ) : (
                <PinLock
                  mode="change"
                  unlocked={isUnlocked}
                  onUnlock={() => {
                    setIsUnlocked(true);
                    setChangePinMode(false);
                  }}
                  onCancel={() => setChangePinMode(false)}
                />
              )}
              <button className="secondary" onClick={clearTasks} type="button">
                Clear all local tasks
              </button>
              <label className="toggle">
                <input
                  checked={defaultSoundEnabled}
                  type="checkbox"
                  onChange={(event) => {
                    setDefaultSoundEnabled(event.target.checked);
                    storage.setDefaultSoundEnabled(event.target.checked);
                  }}
                />
                Default sound enabled
              </label>
            </section>
          )}
        </section>
      )}

      <TabBar activeTab={activeTab} onChange={(tab) => !locked && setActiveTab(tab)} />
    </main>
  );
}
