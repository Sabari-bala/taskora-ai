import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { AssigneePicker } from './AssigneePicker';
import { TASK_PRIORITIES } from '../../lib/constants';

export function TaskCreateModal({
  open,
  onOpenChange,
  status,
  workspaceId,
  onSubmit,
  isSubmitting,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      due_date: dueDate || null,
      assignee: assignee?.id || null,
    });
  }

  function handleClose(nextOpen) {
    if (!nextOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignee(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="New task"
      description={`Will be added to the "${status.replace('_', ' ')}" column.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-800">Description</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500"
            placeholder="Optional details…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-800">Priority</label>
            <select
              className="h-10 rounded-md border border-paper-300 bg-paper-100 px-3 text-body text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Due date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-800">Assignee</label>
          <AssigneePicker
            workspaceId={workspaceId}
            value={assignee}
            onChange={setAssignee}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
