import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export function Drawer({ open, onOpenChange, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 animate-fade-in" />
        <Dialog.Content
          id="taskora-dialog-content"
          className={cn(
            'fixed top-0 right-0 bottom-0 z-50 bg-paper-100 border-l border-paper-300',
            'w-full max-w-[640px] overflow-y-auto shadow-lg animate-slide-in',
            className
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Task detail</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
