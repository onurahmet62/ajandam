import { useEffect, useState, useRef } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';

const PRESET_COLORS = [
  '#FFB5A7', '#FFDAB9', '#B5EAD7', '#A7C7E7',
  '#C3B1E1', '#F8C8DC', '#FFE5B4', '#98D8C8',
];

interface Props {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagPicker({ selectedTagIds, onChange }: Props) {
  const { tags, fetchTags, createTag } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tags.length === 0) fetchTags();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedTagIds.includes(id)
        ? selectedTagIds.filter((t) => t !== id)
        : [...selectedTagIds, id]
    );
  };

  const handleCreateTag = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const tag = await createTag(newName.trim(), newColor);
      onChange([...selectedTagIds, tag.id]);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setShowNew(false);
    } finally {
      setCreating(false);
    }
  };

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">Etiketler</label>

      {/* Selected tags display + trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-gray-200 cursor-pointer flex flex-wrap items-center gap-1.5 hover:border-gray-300 transition-colors focus-within:ring-2 focus-within:ring-[var(--theme-color)] focus-within:border-transparent"
      >
        {selectedTags.length === 0 && (
          <span className="text-gray-400 text-sm">Etiket seçin...</span>
        )}
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={(e) => { e.stopPropagation(); toggle(tag.id); }}
              className="hover:opacity-75"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-hidden animate-fade-in">
          <div className="max-h-48 overflow-y-auto p-1.5">
            {tags.length === 0 && !showNew && (
              <p className="text-sm text-gray-400 px-3 py-2">Henüz etiket yok</p>
            )}
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <span
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent',
                    borderColor: tag.color,
                  }}
                >
                  {selectedTagIds.includes(tag.id) && <Check size={10} className="text-white" />}
                </span>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-gray-700">{tag.name}</span>
              </button>
            ))}
          </div>

          {/* Create new tag inline */}
          <div className="border-t border-gray-100 p-2">
            {!showNew ? (
              <button
                onClick={() => setShowNew(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
                Yeni etiket oluştur
              </button>
            ) : (
              <div className="space-y-2 p-1">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Etiket adı..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
                />
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="w-6 h-6 rounded-full transition-transform"
                      style={{
                        backgroundColor: c,
                        transform: newColor === c ? 'scale(1.25)' : 'scale(1)',
                        boxShadow: newColor === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowNew(false); setNewName(''); }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCreateTag}
                    disabled={!newName.trim() || creating}
                    className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={{ backgroundColor: newColor }}
                  >
                    {creating ? '...' : 'Ekle'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
