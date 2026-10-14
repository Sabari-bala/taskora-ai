import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  onConfirm,
  isConfirming,
  confirmLabel = 'Delete',
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#FDEBEC' }}
        >
          <AlertTriangle size={18} style={{ color: '#E5484D' }} />
        </div>
        <p className="text-body-sm text-ink-600 pt-1.5">
          This will permanently remove the item. You cannot undo this.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="inline-flex items-center justify-center h-10 px-4 rounded-md font-medium text-body transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#E5484D', color: '#FFFFFF' }}
        >
          {isConfirming ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
