import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Smile, Meh, Frown, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useJournalStore } from '../stores/journalStore';
import toast from 'react-hot-toast';

const moods = [
  { value: 'harika', label: 'Harika', icon: Heart, color: '#F8C8DC' },
  { value: 'iyi', label: 'İyi', icon: Smile, color: '#B5EAD7' },
  { value: 'normal', label: 'Normal', icon: Meh, color: '#A7C7E7' },
  { value: 'kotu', label: 'Kötü', icon: Frown, color: '#FFB5A7' },
];

export default function JournalPage() {
  const { entries, fetchEntries, deleteEntry } = useJournalStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchEntries(); }, []);

  const getMood = (mood?: string) => moods.find((m) => m.value === mood);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Günlük</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          <Plus size={18} /> Yeni Giriş
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Henüz günlük girişi yok</div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {entries.map((entry) => {
            const mood = getMood(entry.mood);
            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-6 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                      {format(new Date(entry.date), 'd MMMM yyyy, EEEE', { locale: tr })}
                    </span>
                    {mood && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: mood.color + '40', color: mood.color }}>
                        <mood.icon size={12} /> {mood.label}
                      </span>
                    )}
                  </div>
                  <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteEntry(entry.id); toast.success('Giriş silindi'); } }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateJournalModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateJournalModal({ onClose }: { onClose: () => void }) {
  const { createEntry } = useJournalStore();
  const [content, setContent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createEntry(content, new Date(date).toISOString(), mood || undefined);
      toast.success('Günlük girişi oluşturuldu');
      onClose();
    } catch {
      toast.error('Giriş oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Günlük Girişi</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Ruh Hali</label>
            <div className="flex gap-2">
              {moods.map((m) => (
                <button key={m.value} type="button"
                  onClick={() => setMood(mood === m.value ? '' : m.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${
                    mood === m.value ? 'border-transparent text-white' : 'border-gray-200 text-gray-600'
                  }`}
                  style={mood === m.value ? { backgroundColor: m.color } : undefined}>
                  <m.icon size={16} /> {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">İçerik</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none"
              placeholder="Bugün neler oldu?" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={saving || !content.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
