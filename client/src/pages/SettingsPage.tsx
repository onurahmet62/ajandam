import { useState } from 'react';
import { Palette, User, Tags, Plus, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import toast from 'react-hot-toast';

const themeColors = [
  { name: 'Pastel Mavi', value: '#A7C7E7' },
  { name: 'Pastel Pembe', value: '#F8C8DC' },
  { name: 'Pastel Yeşil', value: '#B5EAD7' },
  { name: 'Lavanta', value: '#C3B1E1' },
  { name: 'Şeftali', value: '#FFDAB9' },
  { name: 'Mint', value: '#B2F2BB' },
  { name: 'Pastel Sarı', value: '#FFF3B0' },
  { name: 'Mercan', value: '#FFB5A7' },
];

export default function SettingsPage() {
  const { user, updateTheme } = useAuthStore();
  const { tags, fetchTags, createTag, deleteTag } = useTaskStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#A7C7E7');
  const [loadedTags, setLoadedTags] = useState(false);

  if (!loadedTags) { fetchTags(); setLoadedTags(true); }

  const handleThemeChange = async (color: string) => {
    try {
      await updateTheme(color);
      toast.success('Tema güncellendi');
    } catch {
      toast.error('Tema güncellenemedi');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag(newTagName, newTagColor);
      setNewTagName('');
      toast.success('Etiket oluşturuldu');
    } catch {
      toast.error('Etiket oluşturulamadı');
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ayarlar</h1>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User size={20} style={{ color: 'var(--theme-color)' }} />
          <h2 className="text-lg font-semibold text-gray-800">Profil</h2>
        </div>
        {user && (
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Ad Soyad:</span> <span className="font-medium">{user.fullName}</span></p>
            <p><span className="text-gray-500">E-posta:</span> <span className="font-medium">{user.email}</span></p>
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette size={20} style={{ color: 'var(--theme-color)' }} />
          <h2 className="text-lg font-semibold text-gray-800">Tema Rengi</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {themeColors.map((color) => (
            <button key={color.value} onClick={() => handleThemeChange(color.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                user?.themeColor === color.value ? 'border-gray-800 shadow-sm' : 'border-transparent hover:border-gray-200'
              }`}>
              <div className="w-10 h-10 rounded-full shadow-sm" style={{ backgroundColor: color.value }} />
              <span className="text-xs text-gray-600">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Tags size={20} style={{ color: 'var(--theme-color)' }} />
          <h2 className="text-lg font-semibold text-gray-800">Etiketler</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
            placeholder="Etiket adı" />
          <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
            className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer" />
          <button onClick={handleCreateTag}
            className="px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            <Plus size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm group" style={{ backgroundColor: tag.color }}>
              {tag.name}
              <button onClick={() => { deleteTag(tag.id); toast.success('Etiket silindi'); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
