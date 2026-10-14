import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Folder } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { projectsApi } from './api';

export function NewProjectModal({ open, onOpenChange, workspaceId, onCreated }) {
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  const create = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast(`Created "${project.name}"`, { variant: 'success' });
      handleClose(false);
      onCreated?.(project);
    },
    onError: (err) => {
      const data = err?.response?.data;
      const detail =
        data?.errors?.key?.[0] ||
        data?.errors?.name?.[0] ||
        data?.detail ||
        'Could not create project.';
      toast(detail, { variant: 'error' });
    },
  });

  function handleClose(nextOpen) {
    if (!nextOpen) {
      setName('');
      setKey('');
      setDescription('');
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    create.mutate({
      workspace: workspaceId,
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim(),
    });
  }

  /* Auto-suggest key from name */
  function handleNameChange(v) {
    setName(v);
    if (!key && v.trim()) {
      const suggested = v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5);
      setKey(suggested);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="New project"
      description="Create a project manually."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="Website Redesign"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          autoFocus
          required
        />
        <Input
          label="Key"
          placeholder="WEB"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          maxLength={10}
          helper="Short uppercase identifier used in task IDs."
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-800">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — what is this project about?"
            className="w-full min-h-[80px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={create.isPending} leadingIcon={Folder}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
