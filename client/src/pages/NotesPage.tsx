import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNoteStore } from '../stores/noteStore';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { notes, fetchNotes, deleteNote } = useNoteStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchNotes(); }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notlar</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          <Plus size={18} /> Yeni Not
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Henüz not eklenmedi</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{note.title}</h3>
                <button onClick={() => { if (confirm('Notu silmek istediğinize emin misiniz?')) { deleteNote(note.id); toast.success('Not silindi'); } }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{note.content}</p>
              <p className="text-xs text-gray-400 mt-3">{format(new Date(note.date), 'd MMMM yyyy', { locale: tr })}</p>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateNoteModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateNoteModal({ onClose }: { onClose: () => void }) {
  const { createNote } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await createNote(title, content, new Date(date).toISOString());
      toast.success('Not oluşturuldu');
      onClose();
    } catch {
      toast.error('Not oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Not</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
              placeholder="Not başlığı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">İçerik</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none"
              placeholder="Not içeriği..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={saving || !title.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
