import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({ open, onOpenChange, title, description, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content
          id="taskora-dialog-content"
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-paper-100 rounded-lg shadow-lg border border-paper-300',
            'w-[calc(100vw-32px)] animate-slide-up',
            sizes[size] || sizes.md
          )}
        >
          <div className="flex items-start justify-between p-5 border-b border-paper-200">
            <div>
              <Dialog.Title className="text-h4 font-semibold text-ink-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-body-sm text-ink-600">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 rounded text-ink-500 hover:text-ink-800 hover:bg-paper-150 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
