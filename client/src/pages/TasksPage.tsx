import { useEffect, useState } from 'react';
import { Plus, Check, X as XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTaskStore } from '../stores/taskStore';
import { Priority, TodoStatus, PriorityLabels, PriorityColors, StatusLabels, RecurrenceType, type TodoTask, type Tag } from '../lib/types';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { tasks, tags, fetchTasks, fetchTags, updateTask } = useTaskStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<TodoStatus | -1>(-1);
  const [filterTag, setFilterTag] = useState<string>('');

  useEffect(() => { fetchTasks(); fetchTags(); }, []);

  const filtered = tasks.filter((t) => {
    if (filterStatus !== -1 && t.status !== filterStatus) return false;
    if (filterTag && !t.tags.some((tag) => tag.id === filterTag)) return false;
    return true;
  });

  const toggleStatus = async (task: TodoTask) => {
    const newStatus = task.status === TodoStatus.Yapildi ? TodoStatus.Planlandi : TodoStatus.Yapildi;
    await updateTask(task.id, { status: newStatus });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Görevler</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          <Plus size={18} /> Yeni Görev
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => setFilterStatus(Number(e.target.value) as any)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]">
          <option value={-1}>Tüm Durumlar</option>
          {Object.entries(StatusLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]">
          <option value="">Tüm Etiketler</option>
          {tags.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Görev bulunamadı</div>
        ) : (
          filtered.map((task) => (
            <div key={task.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setSelectedTask(task)}>
              <button onClick={(e) => { e.stopPropagation(); toggleStatus(task); }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.status === TodoStatus.Yapildi ? 'border-green-400 bg-green-400 text-white' : 'border-gray-300 hover:border-gray-400'
                }`}>
                {task.status === TodoStatus.Yapildi && <Check size={14} />}
              </button>
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: PriorityColors[task.priority] }} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${task.status === TodoStatus.Yapildi ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {task.dueDate && (
                    <span className="text-xs text-gray-400">
                      {format(new Date(task.dueDate), 'd MMM yyyy HH:mm', { locale: tr })}
                    </span>
                  )}
                  {task.tags.map((tag) => (
                    <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-500">{PriorityLabels[task.priority]}</span>
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      {showCreate && <CreateTaskModal tags={tags} onClose={() => setShowCreate(false)} />}

      {/* Edit modal */}
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function CreateTaskModal({ tags, onClose }: { tags: Tag[]; onClose: () => void }) {
  const { createTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.Orta);
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(RecurrenceType.None);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title, description: description || undefined, priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        startDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        recurrenceType: recurrence,
      });
      toast.success('Görev oluşturuldu');
      onClose();
    } catch {
      toast.error('Görev oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Görev</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><XIcon size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
              placeholder="Görev başlığı" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none"
              placeholder="Açıklama (isteğe bağlı)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Öncelik</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                {Object.entries(PriorityLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Tekrar</label>
              <select value={recurrence} onChange={(e) => setRecurrence(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                <option value={0}>Tekrar Yok</option>
                <option value={1}>Günlük</option>
                <option value={2}>Haftalık</option>
                <option value={3}>Aylık</option>
                <option value={4}>Yıllık</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Etiketler</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.id} type="button"
                    onClick={() => setSelectedTags((s) => s.includes(tag.id) ? s.filter((id) => id !== tag.id) : [...s, tag.id])}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedTags.includes(tag.id) ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : undefined}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            İptal
          </button>
          <button type="submit" disabled={saving || !title.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {saving ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
