import { useState } from 'react';
import { useCreateWorkspace } from './hooks';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function NewWorkspaceModal({ open, onOpenChange, onCreated }) {
  const toast = useToast();
  const createMutation = useCreateWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleClose(nextOpen) {
    if (!nextOpen) {
      setName('');
      setDescription('');
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const ws = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
      });
      toast('Workspace created', { variant: 'success' });
      handleClose(false);
      onCreated?.(ws);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not create workspace.';
      toast(detail, { variant: 'error' });
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="New workspace"
      description="A workspace organises projects, tasks, and teammates."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="My Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-800">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — what is this workspace for?"
            className="w-full min-h-[70px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}
