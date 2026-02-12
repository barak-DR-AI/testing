'use client';

import { useEffect, useMemo, useState } from 'react';
import { sha256, storage } from '@/lib/storage';

function PinField({ pin, onChange }: { pin: string; onChange: (pin: string) => void }) {
  return (
    <input
      aria-label="PIN"
      className="pin-input"
      inputMode="numeric"
      maxLength={4}
      pattern="[0-9]{4}"
      placeholder="••••"
      type="password"
      value={pin}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
    />
  );
}

export function PinLock({
  unlocked,
  onUnlock,
  mode = 'gate',
  onCancel,
}: {
  unlocked: boolean;
  onUnlock: () => void;
  mode?: 'gate' | 'change';
  onCancel?: () => void;
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [hasPinHash, setHasPinHash] = useState(false);

  useEffect(() => {
    setHasPinHash(Boolean(storage.getPinHash()));
  }, [unlocked, mode]);

  const isCreateFlow = useMemo(() => mode === 'change' || !hasPinHash, [hasPinHash, mode]);

  async function submit() {
    if (pin.length !== 4) {
      setMessage('PIN must be 4 digits.');
      return;
    }

    if (isCreateFlow) {
      if (pin !== confirmPin) {
        setMessage('PIN entries do not match.');
        return;
      }
      storage.setPinHash(await sha256(pin));
      setMessage(mode === 'change' ? 'PIN changed.' : 'PIN set. App unlocked.');
      onUnlock();
      setPin('');
      setConfirmPin('');
      return;
    }

    const hash = await sha256(pin);
    if (hash === storage.getPinHash()) {
      setMessage('Unlocked.');
      onUnlock();
      setPin('');
      return;
    }

    setMessage('Incorrect PIN.');
  }

  return (
    <section className={mode === 'gate' ? 'lock-screen card' : 'card'}>
      <h2>{isCreateFlow ? 'Set your 4-digit PIN' : 'Enter your PIN'}</h2>
      <PinField pin={pin} onChange={setPin} />
      {isCreateFlow && (
        <>
          <label className="field-label">Confirm PIN</label>
          <PinField pin={confirmPin} onChange={setConfirmPin} />
        </>
      )}
      <div className="row">
        <button onClick={submit} type="button">
          {isCreateFlow ? 'Save PIN' : 'Unlock'}
        </button>
        {mode === 'change' && onCancel && (
          <button className="secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
      </div>
      {message && <p className="muted">{message}</p>}
    </section>
  );
}
