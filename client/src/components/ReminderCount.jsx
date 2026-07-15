import { Mail } from 'lucide-react';

function formatReminderDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ReminderCount({ history = [] }) {
  const count = history.length;

  if (count === 0) {
    return (
      <span
        className="inline-flex items-center justify-center gap-1.5 text-slate-400"
        title="No reminders sent yet"
      >
        <Mail className="h-3.5 w-3.5 shrink-0 opacity-50" />
        <span className="whitespace-nowrap text-xs">0 sent</span>
      </span>
    );
  }

  const tooltip = history
    .map((ts, i) => `${i + 1}. ${formatReminderDate(ts)}`)
    .join('\n');

  const label = count === 1 ? '1 reminder' : `${count} reminders`;

  return (
    <span
      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200"
      title={tooltip}
    >
      <Mail className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
