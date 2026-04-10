import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isPast, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ListTodo, Timer, StickyNote, ArrowRight, Clock } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { useCountdownStore } from '../stores/countdownStore';
import { useNoteStore } from '../stores/noteStore';
import { PriorityColors, StatusLabels, TodoStatus, type TodoTask } from '../lib/types';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDate);
  const now = new Date();
  if (target <= now) return <span className="text-gray-400">Süre doldu</span>;

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;

  return (
    <span className="font-mono text-lg font-semibold" style={{ color: 'var(--theme-color)' }}>
      {days > 0 && `${days}g `}{hours}s {minutes}d
    </span>
  );
}

export default function DashboardPage() {
  const { tasks, fetchTasks } = useTaskStore();
  const { countdowns, fetchActive } = useCountdownStore();
  const { notes, fetchNotes } = useNoteStore();

  useEffect(() => {
    fetchTasks();
    fetchActive();
    fetchNotes();
  }, []);

  const todayTasks = tasks.filter((t) => {
    const date = t.dueDate || t.startDate;
    return date && isToday(new Date(date)) && t.status !== TodoStatus.IptalEdildi;
  });

  const overdueTasks = tasks.filter((t) => {
    const date = t.dueDate;
    return date && isPast(new Date(date)) && !isToday(new Date(date)) && t.status === TodoStatus.Planlandi;
  });

  const recentNotes = notes.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
        </h1>
        <p className="text-gray-500 mt-1">Bugüne genel bakış</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bugünün Görevleri", value: todayTasks.length, icon: ListTodo, color: '#A7C7E7' },
          { label: "Geciken Görevler", value: overdueTasks.length, icon: Clock, color: '#FFB5A7' },
          { label: "Aktif Geri Sayım", value: countdowns.length, icon: Timer, color: '#C3B1E1' },
          { label: "Toplam Not", value: notes.length, icon: StickyNote, color: '#B5EAD7' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '30' }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Bugünün Görevleri</h2>
            <Link to="/tasks" className="text-sm flex items-center gap-1 hover:underline" style={{ color: 'var(--theme-color)' }}>
              Tümü <ArrowRight size={14} />
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Bugün için görev yok</p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Countdowns */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Geri Sayımlar</h2>
            <Link to="/countdowns" className="text-sm flex items-center gap-1 hover:underline" style={{ color: 'var(--theme-color)' }}>
              Tümü <ArrowRight size={14} />
            </Link>
          </div>
          {countdowns.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aktif geri sayım yok</p>
          ) : (
            <div className="space-y-3">
              {countdowns.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{c.title}</span>
                  <CountdownTimer targetDate={c.targetDate} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h2 className="text-lg font-semibold text-red-500 mb-4">Geciken Görevler</h2>
            <div className="space-y-3">
              {overdueTasks.slice(0, 5).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Recent notes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Son Notlar</h2>
            <Link to="/notes" className="text-sm flex items-center gap-1 hover:underline" style={{ color: 'var(--theme-color)' }}>
              Tümü <ArrowRight size={14} />
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Henüz not yok</p>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="p-3 rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">{note.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(note.date), 'd MMM yyyy', { locale: tr })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: TodoTask }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PriorityColors[task.priority] }} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === TodoStatus.Yapildi ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {task.title}
        </p>
        {task.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {task.tags.map((tag) => (
              <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs px-2 py-1 rounded-lg bg-white text-gray-500">{StatusLabels[task.status]}</span>
    </div>
  );
}
