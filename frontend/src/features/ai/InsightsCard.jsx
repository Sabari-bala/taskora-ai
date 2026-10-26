import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useProjectInsights } from './hooks';
import { cn } from '../../lib/utils';

export function InsightsCard({ projectId }) {
  const insights = useProjectInsights();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  async function generate() {
    setError(null);
    try {
      const res = await insights.mutateAsync(projectId);
      setResult(res.insights);
      setCollapsed(false);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate insights.');
    }
  }

  if (!result) {
    if (error) {
      return (
        <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-[var(--danger-text)]">
          <p className="font-medium">AI Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={generate} className="mt-3 text-sm underline">Try again</button>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-paper-200 bg-signal-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-signal-500 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-800">
            Get an AI read on this project's progress, risks, and priorities.
          </p>
        </div>
        
        {/* THE FIX: w-full on mobile, shrink-0 and whitespace-nowrap for the button */}
        <button
          onClick={generate}
          disabled={insights.isPending}
          className="w-full sm:w-auto shrink-0 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-signal-500 hover:bg-signal-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Sparkles size={16} />
          {insights.isPending ? 'Generating...' : 'Generate insights'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-paper-200 bg-white shadow-sm overflow-hidden animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 bg-signal-50 hover:bg-signal-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-signal-500" />
          <span className="font-medium text-sm text-ink-900">AI Project Insights</span>
        </div>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      
      {!collapsed && (
        <div className="p-4 text-sm text-ink-700 space-y-4 border-t border-paper-200">
          <div>
            <h4 className="font-medium text-ink-900 mb-1">Summary</h4>
            <p>{result.summary}</p>
          </div>
          {result.risks?.length > 0 && (
            <div>
              <h4 className="font-medium text-ink-900 mb-1 text-red-600">Risks</h4>
              <ul className="list-disc pl-4 space-y-1">
                {result.risks.map((risk, i) => <li key={i}>{risk}</li>)}
              </ul>
            </div>
          )}
          {result.priorities?.length > 0 && (
            <div>
              <h4 className="font-medium text-ink-900 mb-1">Next Priorities</h4>
              <ul className="list-disc pl-4 space-y-1">
                {result.priorities.map((prio, i) => <li key={i}>{prio}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
