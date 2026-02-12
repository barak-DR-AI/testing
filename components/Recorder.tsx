'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export function Recorder({
  onAudioReady,
  compact,
}: {
  onAudioReady: (payload: { url?: string; file?: File; sourceName?: string }) => void;
  compact?: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window;

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const type = chunksRef.current[0]?.type || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      const file = new File([blob], 'recorded-audio.webm', { type });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      onAudioReady({ url, file, sourceName: file.name });
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    recorderRef.current = recorder;
    setSeconds(0);
    setIsRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
  }

  function clear() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(undefined);
    onAudioReady({});
    setSeconds(0);
  }

  const timer = useMemo(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [seconds]);

  if (!supported) {
    return (
      <div className="card muted-block">
        <p>Audio recording is not supported in this browser. You can still upload an audio file.</p>
        <input
          accept="audio/*"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
            onAudioReady({ url, file, sourceName: file.name });
          }}
        />
        {audioUrl && <audio controls src={audioUrl} />}
      </div>
    );
  }

  return (
    <section className={compact ? 'recorder compact' : 'recorder'}>
      <div className="row between">
        <strong>Audio</strong>
        <span className="mono">{timer}</span>
      </div>
      <div className="row wrap">
        {!isRecording ? (
          <button className={compact ? 'record-pill' : ''} onClick={startRecording} type="button">
            Start
          </button>
        ) : (
          <button className="danger" onClick={stopRecording} type="button">
            Stop
          </button>
        )}
        {audioUrl && (
          <button className="secondary" onClick={clear} type="button">
            Clear
          </button>
        )}
      </div>
      {audioUrl && <audio controls src={audioUrl} />}
    </section>
  );
}
