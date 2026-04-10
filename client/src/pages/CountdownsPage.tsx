import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Pause, Play } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCountdownStore } from '../stores/countdownStore';
import toast from 'react-hot-toast';

function LiveCountdown({ targetDate }: { targetDate: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDate);
  const now = new Date();
  if (target <= now) return <span className="text-gray-400 text-lg font-mono">Süre doldu!</span>;

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;
  const seconds = differenceInSeconds(target, now) % 60;

  return (
    <div className="flex gap-3">
      {[
        { value: days, label: 'Gün' },
        { value: hours, label: 'Saat' },
        { value: minutes, label: 'Dk' },
        { value: seconds, label: 'Sn' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--theme-color)' }}>
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CountdownsPage() {
  const { countdowns, fetchCountdowns, toggleCountdown, deleteCountdown } = useCountdownStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchCountdowns(); }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Geri Sayımlar</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          <Plus size={18} /> Yeni Geri Sayım
        </button>
      </div>

      {countdowns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Henüz geri sayım yok</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {countdowns.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border border-gray-100 p-6 ${!c.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Hedef: {format(new Date(c.targetDate), 'd MMMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleCountdown(c.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    {c.isActive ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteCountdown(c.id); toast.success('Geri sayım silindi'); } }}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {c.isActive && <LiveCountdown targetDate={c.targetDate} />}
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateCountdownModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateCountdownModal({ onClose }: { onClose: () => void }) {
  const { createCountdown } = useCountdownStore();
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    setSaving(true);
    try {
      await createCountdown(title, new Date(targetDate).toISOString());
      toast.success('Geri sayım oluşturuldu');
      onClose();
    } catch {
      toast.error('Geri sayım oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Geri Sayım</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
              placeholder="Geri sayım başlığı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Hedef Tarih</label>
            <input type="datetime-local" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={saving || !title.trim() || !targetDate}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {saving ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
