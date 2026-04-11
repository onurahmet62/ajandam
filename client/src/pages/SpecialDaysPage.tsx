import { useEffect, useState } from 'react';
import { useSpecialDayStore } from '../stores/specialDayStore';
import { Cake, Plus, Trash2, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = [
  '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444',
  '#3B82F6', '#6366F1', '#14B8A6', '#D946EF', '#F97316',
];

export default function SpecialDaysPage() {
  const { specialDays, loading, fetchAll, create, update, remove } = useSpecialDayStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', date: '', isYearly: true, color: '#EC4899' });

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ title: '', date: '', isYearly: true, color: '#EC4899' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    try {
      if (editingId) {
        await update(editingId, form);
        toast.success('Özel gün güncellendi');
      } else {
        await create(form);
        toast.success('Özel gün eklendi');
      }
      resetForm();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEdit = (day: typeof specialDays[0]) => {
    setEditingId(day.id);
    setForm({
      title: day.title,
      date: day.date.split('T')[0],
      isYearly: day.isYearly,
      color: day.color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Özel gün silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  const getDaysUntil = (dateStr: string, isYearly: boolean) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    let target: Date;
    if (isYearly) {
      target = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      if (target < now) target = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    } else {
      target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cake size={28} className="text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-800">Özel Günler</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.97]"
          style={{ backgroundColor: '#EC4899' }}
        >
          <Plus size={18} />
          Yeni Özel Gün
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Özel Günü Düzenle' : 'Yeni Özel Gün'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
              <input
                type="text"
                placeholder="Doğum günüm, Yıldönümü..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Renk</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-9 h-9 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      border: form.color === c ? '3px solid #1f2937' : '3px solid transparent',
                      transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isYearly}
                onChange={(e) => setForm({ ...form, isYearly: e.target.checked })}
                className="rounded border-gray-300"
              />
              Her yıl tekrarla
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.date}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              style={{ backgroundColor: form.color }}
            >
              <Check size={16} />
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading && specialDays.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : specialDays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Cake size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Henüz özel gün eklenmemiş</p>
          <p className="text-gray-400 text-sm mt-1">Doğum günleri, yıl dönümleri ve önemli tarihleri ekleyin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {specialDays.map((day) => {
            const daysUntil = getDaysUntil(day.date, day.isYearly);
            const isToday = daysUntil === 0;
            const d = new Date(day.date);
            return (
              <div
                key={day.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: day.color }}
                >
                  {d.getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{day.title}</h3>
                  <p className="text-sm text-gray-500">
                    {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {day.isYearly && <span className="ml-2 text-xs text-gray-400">(her yıl)</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {isToday ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: day.color }}>
                      Bugün!
                    </span>
                  ) : daysUntil > 0 ? (
                    <div>
                      <span className="text-lg font-bold" style={{ color: day.color }}>{daysUntil}</span>
                      <span className="text-xs text-gray-400 ml-1">gün kaldı</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Geçmiş</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(day)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(day.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
