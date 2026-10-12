import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useSummarizeTask } from './hooks';
import { cn } from '../../lib/utils';

export function SummarizePanel({ taskId }) {
  const summarize = useSummarizeTask();
  const [result, setResult] = useState(null);
  const [visible, setVisible] = useState(false);

  async function generate() {
    try {
      const res = await summarize.mutateAsync(taskId);
      setResult(res.summary);
      setVisible(true);
    } catch {
      // toast handled elsewhere; user can retry
    }
  }

  if (!visible && !summarize.isPending) {
    return (
      <Button
        variant="ai"
        size="sm"
        leadingIcon={Sparkles}
        onClick={generate}
      >
        Summarize with AI
      </Button>
    );
  }

  if (summarize.isPending) {
    return (
      <div className="rounded-lg border border-ember-100 bg-ember-50 p-4 flex items-center gap-3">
        <Loader2 size={16} className="text-ember-500 animate-spin" />
        <p className="text-body-sm text-ink-700">Summarising this task…</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div
      className="rounded-lg border border-ember-100 p-4 space-y-4 relative"
      style={{ backgroundColor: 'var(--ember-50)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-ember-500" />
          <p className="text-overline text-ember-600">AI SUMMARY</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={generate}
            className="p-1 rounded text-ink-500 hover:text-ink-800 hover:bg-paper-100 transition-colors"
            aria-label="Regenerate"
          >
            <RefreshCw size={12} />
          </button>
          <button
            type="button"
            onClick={() => { setVisible(false); setResult(null); }}
            className="p-1 rounded text-ink-500 hover:text-ink-800 hover:bg-paper-100 transition-colors"
            aria-label="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <p className="text-body-sm text-ink-800 leading-relaxed">
        {result.summary}
      </p>

      {result.decisions?.length > 0 && (
        <SummarySection title="Decisions" items={result.decisions} />
      )}
      {result.blockers?.length > 0 && (
        <SummarySection title="Blockers" items={result.blockers} tone="warning" />
      )}
      {result.next_actions?.length > 0 && (
        <SummarySection title="Next actions" items={result.next_actions} tone="signal" />
      )}
    </div>
  );
}

function SummarySection({ title, items, tone = 'neutral' }) {
  const colors = {
    neutral: 'text-ink-700',
    warning: 'text-[var(--warning-text)]',
    signal: 'text-signal-700',
  };
  return (
    <div>
      <p className={cn('text-overline mb-1', colors[tone])}>
        {title.toUpperCase()}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-body-sm text-ink-800">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-ink-500 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
