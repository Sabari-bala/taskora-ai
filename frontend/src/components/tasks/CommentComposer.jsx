import { useState } from 'react';
import { Button } from '../ui/Button';

export function CommentComposer({ onSubmit, isSubmitting }) {
  const [body, setBody] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await onSubmit(body.trim());
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        className="w-full min-h-[80px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500 resize-y"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit(e);
          }
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-caption text-ink-500">Ctrl+Enter to send</p>
        <Button
          type="submit"
          size="sm"
          isLoading={isSubmitting}
          disabled={!body.trim()}
        >
          Comment
        </Button>
      </div>
    </form>
  );
}
