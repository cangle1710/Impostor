import { useState, useEffect } from 'react';

export default function Timer({ endsAt, onExpire }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && onExpire) onExpire();
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;

  const pct = endsAt
    ? Math.max(0, Math.min(1, (endsAt - Date.now()) / ((endsAt - Date.now()) + (600 - remaining) * 1000)))
    : 1;

  const urgent = remaining <= 30;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`text-5xl font-bold tabular-nums transition-colors
          ${urgent ? 'text-red-400' : 'text-purple-400'}`}
      >
        {display}
      </div>
      <div className="w-48 h-2 bg-[#352a5e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${urgent ? 'bg-red-500' : 'bg-purple-600'}`}
          style={{ width: `${remaining > 0 ? (remaining / Math.ceil((endsAt ? (endsAt - (endsAt - remaining * 1000 - Date.now() + remaining * 1000)) / 1000 : 1)) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
