import { useState } from 'react';
import { Sparkles, Check, X, Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { usePlanProject, useCommitPlan } from './hooks';
import { cn } from '../../lib/utils';

const STEPS = ['describe', 'review', 'done'];

export function PlannerModal({ open, onOpenChange, workspaceId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const planMutation = usePlanProject();
  const commitMutation = useCommitPlan();

  const [step, setStep] = useState('describe');

  // Step 1 inputs
  const [idea, setIdea] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [timeline, setTimeline] = useState('8 weeks');
  const [detailLevel, setDetailLevel] = useState('balanced');

  // Step 2 — editable proposal
  const [proposal, setProposal] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedMilestones, setSelectedMilestones] = useState(new Set());

  function resetAll() {
    setStep('describe');
    setIdea('');
    setTeamSize(4);
    setTimeline('8 weeks');
    setDetailLevel('balanced');
    setProposal(null);
    setProjectName('');
    setProjectKey('');
    setSelectedTasks(new Set());
    setSelectedMilestones(new Set());
  }

  function handleClose(nextOpen) {
    if (!nextOpen) {
      // Reset after modal closes
      setTimeout(resetAll, 200);
    }
    onOpenChange(nextOpen);
  }

  async function handleGenerate() {
    if (idea.trim().length < 20) {
      toast('Describe your idea in a bit more detail (20+ characters).', {
        variant: 'warning',
      });
      return;
    }

    try {
      const result = await planMutation.mutateAsync({
        workspace_id: workspaceId,
        idea: idea.trim(),
        team_size: teamSize,
        timeline,
        detail_level: detailLevel,
      });
      const p = result.proposal;
      setProposal(p);

      // Suggest a project name from the overview
      const suggested = p.overview.split('.')[0].slice(0, 60) || 'New Project';
      setProjectName(suggested);
      setProjectKey('PROJ');

      // Select all by default
      setSelectedTasks(new Set(p.tasks.map((_, i) => i)));
      setSelectedMilestones(new Set(p.milestones.map((_, i) => i)));
      setStep('review');
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        'AI could not generate a plan right now. Try again.';
      toast(detail, { variant: 'error' });
    }
  }

  async function handleCommit() {
    if (!projectName.trim() || !projectKey.trim()) {
      toast('Project name and key are required.', { variant: 'warning' });
      return;
    }

    const tasks = proposal.tasks.filter((_, i) => selectedTasks.has(i));
    const milestones = proposal.milestones.filter((_, i) =>
      selectedMilestones.has(i)
    );

    if (tasks.length === 0) {
      toast('Select at least one task.', { variant: 'warning' });
      return;
    }

    try {
      const result = await commitMutation.mutateAsync({
        workspace_id: workspaceId,
        project_name: projectName.trim(),
        project_key: projectKey.trim(),
        project_description: proposal.overview,
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description || '',
        })),
        tasks: tasks.map((t) => ({
          title: t.title,
          description: t.description || '',
          epic: t.epic || '',
          priority: t.priority || 'medium',
          estimated_hours: t.estimated_hours || null,
          milestone_title: t.milestone_title || '',
        })),
      });

      toast(
        `Created "${result.project_name}" with ${result.tasks_created} task${result.tasks_created === 1 ? '' : 's'}`,
        { variant: 'success' }
      );
      handleClose(false);
      navigate(`/projects/${result.project_id}`);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.errors?.project_key?.[0] ||
        'Could not create the project. Try again.';
      toast(detail, { variant: 'error' });
    }
  }

  function toggleTask(i) {
    const next = new Set(selectedTasks);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedTasks(next);
  }

  function toggleMilestone(i) {
    const next = new Set(selectedMilestones);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedMilestones(next);
  }

  function toggleAll() {
    if (selectedTasks.size === proposal.tasks.length) {
      setSelectedTasks(new Set());
      setSelectedMilestones(new Set());
    } else {
      setSelectedTasks(new Set(proposal.tasks.map((_, i) => i)));
      setSelectedMilestones(new Set(proposal.milestones.map((_, i) => i)));
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      size={step === 'review' ? 'lg' : 'md'}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles size={16} className="text-ember-500" />
          Plan a project with AI
        </span>
      }
      description={
        step === 'describe'
          ? 'Describe what you want to build. AI will propose a structure.'
          : step === 'review'
          ? 'Review the proposal. Uncheck anything you don\'t want. Edit the project name and key.'
          : ''
      }
    >
      {step === 'describe' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-800">
              Project idea
            </label>
            <textarea
              autoFocus
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Build an online food delivery platform with restaurant listings, cart, checkout, order tracking, and an admin dashboard."
              className="w-full min-h-[120px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ember-500 focus:border-ember-500 resize-y"
            />
            <p className="text-caption text-ink-500">
              {idea.length} / 2000 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Team size"
              min={1}
              max={50}
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
            />
            <Input
              label="Timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="8 weeks"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-800">
              Detail level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['summary', 'balanced', 'deep'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDetailLevel(d)}
                  className={cn(
                    'h-9 rounded-md text-body-sm font-medium capitalize border transition-colors',
                    detailLevel === d
                      ? 'bg-ember-50 text-ember-600 border-ember-100'
                      : 'bg-paper-100 text-ink-600 border-paper-300 hover:border-paper-400'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              variant="ai"
              onClick={handleGenerate}
              isLoading={planMutation.isPending}
              leadingIcon={planMutation.isPending ? undefined : Sparkles}
            >
              {planMutation.isPending ? 'Generating…' : 'Generate plan'}
            </Button>
          </div>

          {planMutation.isPending && (
            <p className="text-caption text-ink-500 text-center">
              This usually takes 5-15 seconds.
            </p>
          )}
        </div>
      )}

      {step === 'review' && proposal && (
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Editable project name + key */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <Input
              label="Key"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>

          {/* Overview */}
          <div className="rounded-md border border-paper-200 bg-paper-50 p-3">
            <p className="text-overline text-ink-500 mb-1.5">OVERVIEW</p>
            <p className="text-body-sm text-ink-800 leading-relaxed">
              {proposal.overview}
            </p>
          </div>

          {/* Selection summary + toggle all */}
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-ink-600">
              {selectedMilestones.size} / {proposal.milestones.length} milestones ·{' '}
              {selectedTasks.size} / {proposal.tasks.length} tasks selected
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-caption text-signal-500 hover:text-signal-600 font-medium"
            >
              {selectedTasks.size === proposal.tasks.length
                ? 'Deselect all'
                : 'Select all'}
            </button>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-overline text-ink-500 mb-2">MILESTONES</p>
            <div className="space-y-1">
              {proposal.milestones.map((m, i) => (
                <CheckRow
                  key={i}
                  checked={selectedMilestones.has(i)}
                  onToggle={() => toggleMilestone(i)}
                  title={m.title}
                  subtitle={m.description}
                />
              ))}
            </div>
          </div>

          {/* Tasks grouped by epic */}
          <div>
            <p className="text-overline text-ink-500 mb-2">TASKS</p>
            {groupByEpic(proposal.tasks).map(([epic, tasks]) => (
              <div key={epic} className="mb-4 last:mb-0">
                <p className="text-body-sm font-medium text-ink-700 mb-1.5">
                  {epic || 'Uncategorized'}
                </p>
                <div className="space-y-1 pl-3">
                  {tasks.map(({ task, index }) => (
                    <CheckRow
                      key={index}
                      checked={selectedTasks.has(index)}
                      onToggle={() => toggleTask(index)}
                      title={task.title}
                      badge={task.priority}
                      subtitle={
                        task.estimated_hours
                          ? `${task.estimated_hours}h`
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-2 pt-3 border-t border-paper-200 sticky bottom-0 bg-paper-100 pb-1">
            <Button
              variant="ghost"
              onClick={() => setStep('describe')}
              leadingIcon={ArrowLeft}
            >
              Back
            </Button>
            <Button
              variant="ai"
              onClick={handleCommit}
              isLoading={commitMutation.isPending}
              disabled={selectedTasks.size === 0 || !projectName.trim() || !projectKey.trim()}
            >
              Create {selectedTasks.size} task{selectedTasks.size === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CheckRow({ checked, onToggle, title, subtitle, badge }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-start gap-2 text-left px-2 py-1.5 rounded',
        'hover:bg-paper-50 transition-colors',
        checked ? 'text-ink-800' : 'text-ink-500'
      )}
    >
      <span
        className={cn(
          'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0',
          checked
            ? 'bg-ember-500 border-ember-500 text-white'
            : 'border-paper-400 bg-paper-100'
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-body-sm">{title}</span>
        {badge && (
          <span className="ml-2 text-caption text-ink-500 capitalize">
            {badge}
          </span>
        )}
        {subtitle && (
          <span className="block text-caption text-ink-500 mt-0.5">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}

function groupByEpic(tasks) {
  const map = new Map();
  tasks.forEach((task, index) => {
    const epic = task.epic || 'Uncategorized';
    if (!map.has(epic)) map.set(epic, []);
    map.get(epic).push({ task, index });
  });
  return Array.from(map.entries());
}
