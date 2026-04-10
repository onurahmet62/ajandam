import { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { Priority, PriorityLabels, RecurrenceType } from '../lib/types';
import TagPicker from './TagPicker';
import toast from 'react-hot-toast';

interface Props {
  initialStart?: Date;
  initialEnd?: Date;
  onClose: () => void;
}

export default function CreateTaskModal({ initialStart, initialEnd, onClose }: Props) {
  const { createTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.Orta);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(
    initialStart ? format(initialStart, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [endDate, setEndDate] = useState(
    initialEnd ? format(initialEnd, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [dueDate, setDueDate] = useState(
    initialEnd ? format(initialEnd, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title,
        description: description || undefined,
        priority,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        recurrenceType: RecurrenceType.None,
        recurrenceInterval: 0,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Yeni Görev</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Kişisel</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              placeholder="Görev başlığı..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Açıklama ekleyin..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Öncelik</label>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
              {Object.entries(PriorityLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlangıç</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Bitiş</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Son Tarih</label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-100 gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {saving ? 'Kaydediliyor...' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
