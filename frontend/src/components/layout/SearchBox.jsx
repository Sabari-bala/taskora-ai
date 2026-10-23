import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Folder, ListTodo, Home, CheckSquare } from 'lucide-react';
import { useProjects } from '../../features/projects/hooks';
import { useTasks } from '../../features/tasks/hooks';
import { useWorkspace } from '../../hooks/useWorkspace';
import { cn } from '../../lib/utils';

const EMPTY_ARRAY = [];

export function SearchBox() {
  const navigate = useNavigate();
  const { current } = useWorkspace();
  const { data: projData } = useProjects(current ? { workspace: current.id } : {});
  const { data: taskData } = useTasks({ mine: 'true' });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const projects = projData?.results ?? EMPTY_ARRAY;
  const tasks = taskData?.results ?? EMPTY_ARRAY;

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : tasks;
    return list.slice(0, 5);
  }, [tasks, query]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
      : projects;
    return list.slice(0, 4);
  }, [projects, query]);

  const actions = useMemo(() => {
    const all = [
      { icon: Home, label: 'Go to Dashboard', path: '/dashboard' },
      { icon: CheckSquare, label: 'Go to My Tasks', path: '/tasks' },
      { icon: Folder, label: 'Go to All Projects', path: '/projects' },
    ];
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  const flatItems = useMemo(() => {
    const items = [];
    filteredTasks.forEach((t) => items.push({ path: `/projects/${t.project}` }));
    filteredProjects.forEach((p) => items.push({ path: `/projects/${p.id}` }));
    actions.forEach((a) => items.push({ path: a.path }));
    return items;
  }, [filteredTasks, filteredProjects, actions]);

  useEffect(() => { setHighlight(0); }, [query]);

  useEffect(() => {
    function handleMouseDown(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(path) {
    navigate(path);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (query) setQuery('');
      else { setOpen(false); inputRef.current?.blur(); }
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(flatItems.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[highlight];
      if (item) go(item.path);
    }
  }

  const showEmpty = filteredTasks.length === 0 && filteredProjects.length === 0 && actions.length === 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0 sm:max-w-md">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search tasks, projects…"
        aria-label="Search"
        aria-expanded={open}
        aria-controls="search-suggestions"
        className="w-full h-9 rounded-md border border-paper-300 bg-paper-50 pl-9 pr-3 text-body-sm text-ink-800 placeholder:text-ink-500 hover:border-paper-400 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500 transition-colors"
      />

      {open && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-paper-100 border border-paper-300 rounded-md overflow-hidden animate-slide-up"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="max-h-[400px] overflow-y-auto py-1">
            {showEmpty ? (
              <p className="px-4 py-6 text-center text-body-sm text-ink-500">No results for &quot;{query}&quot;</p>
            ) : (
              <>
                {filteredTasks.length > 0 && (
                  <Section label="TASKS">
                    {filteredTasks.map((task, i) => (
                      <Row key={task.id} icon={ListTodo} highlighted={highlight === i} onClick={() => go(`/projects/${task.project}`)} onMouseEnter={() => setHighlight(i)}>
                        <span className="flex-1 truncate text-ink-800">{task.title}</span>
                        <span className="text-caption text-ink-500 capitalize shrink-0">{task.status.replace('_', ' ')}</span>
                      </Row>
                    ))}
                  </Section>
                )}
                {filteredProjects.length > 0 && (
                  <Section label="PROJECTS">
                    {filteredProjects.map((project, i) => {
                      const g = filteredTasks.length + i;
                      return (
                        <Row key={project.id} icon={Folder} highlighted={highlight === g} onClick={() => go(`/projects/${project.id}`)} onMouseEnter={() => setHighlight(g)}>
                          <span className="flex-1 truncate text-ink-800">{project.name}</span>
                          <span className="text-caption text-ink-500 font-mono shrink-0">{project.key}</span>
                        </Row>
                      );
                    })}
                  </Section>
                )}
                {actions.length > 0 && (
                  <Section label="ACTIONS">
                    {actions.map((action, i) => {
                      const g = filteredTasks.length + filteredProjects.length + i;
                      return (
                        <Row key={action.label} icon={action.icon} highlighted={highlight === g} onClick={() => go(action.path)} onMouseEnter={() => setHighlight(g)}>
                          <span className="flex-1 text-ink-800">{action.label}</span>
                        </Row>
                      );
                    })}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-4 py-1.5 text-overline text-ink-500">{label}</p>
      {children}
    </div>
  );
}

function Row({ icon: Icon, highlighted, onClick, onMouseEnter, children }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={highlighted}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-left text-body-sm transition-colors',
        highlighted ? 'bg-paper-150' : 'hover:bg-paper-50'
      )}
    >
      <Icon size={14} className="text-ink-500 shrink-0" />
      {children}
    </button>
  );
}
