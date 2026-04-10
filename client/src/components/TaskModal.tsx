import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { PriorityLabels, StatusLabels, type TodoTask } from '../lib/types';
import TagPicker from './TagPicker';
import toast from 'react-hot-toast';

interface Props {
  task: TodoTask;
  onClose: () => void;
}

export default function TaskModal({ task, onClose }: Props) {
  const { updateTask, deleteTask } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(task.tags.map((t) => t.id));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTask(task.id, {
        title, description: description || undefined, priority, status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tagIds: selectedTagIds,
      });
      toast.success('Görev güncellendi');
      onClose();
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteTask(task.id);
      toast.success('Görev silindi');
      onClose();
    } catch {
      toast.error('Silme başarısız');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Görev Düzenle</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Öncelik</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                {Object.entries(PriorityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Durum</label>
              <select value={status} onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                {Object.entries(StatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Bitiş Tarihi</label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm">
            <Trash2 size={16} /> Sil
          </button>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              İptal
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-color)' }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
