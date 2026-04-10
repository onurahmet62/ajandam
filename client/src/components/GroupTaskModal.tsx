import { useState } from 'react';
import { X, Trash2, Save, Users } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useGroupStore } from '../stores/groupStore';
import {
  PriorityLabels,
  PriorityColors,
  StatusLabels,
  type GroupTask,
  type Priority,
  type TodoStatus,
} from '../lib/types';
import toast from 'react-hot-toast';

interface Props {
  task: GroupTask;
  isAdmin: boolean;
  onClose: () => void;
}

export default function GroupTaskModal({ task, isAdmin, onClose }: Props) {
  const { updateGroupTask, deleteGroupTask } = useGroupStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<number>(task.priority);
  const [status, setStatus] = useState<number>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '');
  const [startDate, setStartDate] = useState(task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd'T'HH:mm") : '');
  const [endDate, setEndDate] = useState(task.endDate ? format(new Date(task.endDate), "yyyy-MM-dd'T'HH:mm") : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGroupTask(task.groupId, task.id, {
        title,
        description: description || undefined,
        priority: priority as Priority,
        status: status as TodoStatus,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      toast.success('Görev güncellendi');
      onClose();
    } catch {
      toast.error('Görev güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteGroupTask(task.groupId, task.id);
      toast.success('Görev silindi');
      onClose();
    } catch {
      toast.error('Görev silinemedi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Grup Görevi</h2>
            {task.groupName && (
              <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--theme-color)' }}>
                {task.groupName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && !editing && (
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">
                Düzenle
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {editing ? (
            <>
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
                    {Object.entries(PriorityLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Durum</label>
                  <select value={status} onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                    {Object.entries(StatusLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
              </div>
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
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: PriorityColors[task.priority], color: '#4a5568' }}>
                  {PriorityLabels[task.priority]}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                  {StatusLabels[task.status]}
                </span>
                {task.assignedToAll ? (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                    <Users size={12} /> Herkese
                  </span>
                ) : task.assignees.length > 0 && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-600">
                    {task.assignees.map((a) => a.fullName).join(', ')}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                {task.dueDate && (
                  <div>Son Tarih: {format(new Date(task.dueDate), 'd MMMM yyyy HH:mm', { locale: tr })}</div>
                )}
                {task.startDate && (
                  <div>Başlangıç: {format(new Date(task.startDate), 'd MMMM yyyy HH:mm', { locale: tr })}</div>
                )}
                {task.endDate && (
                  <div>Bitiş: {format(new Date(task.endDate), 'd MMMM yyyy HH:mm', { locale: tr })}</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          {isAdmin && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm">
              <Trash2 size={16} /> Sil
            </button>
          )}
          <div className="flex-1" />
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--theme-color)' }}>
                <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
