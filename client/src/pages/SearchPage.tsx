import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTaskStore } from '../stores/taskStore';
import { PriorityColors, PriorityLabels, StatusLabels, type TodoTask } from '../lib/types';
import TaskModal from '../components/TaskModal';

export default function SearchPage() {
  const { searchTasks } = useTaskStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TodoTask[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchTasks(query);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Görev Ara</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
            placeholder="Başlık, açıklama veya etiket ara..." />
        </div>
        <button type="submit" disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          {loading ? 'Arıyor...' : 'Ara'}
        </button>
      </form>

      {searched && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{results.length} sonuç bulundu</p>
          {results.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Sonuç bulunamadı</div>
          ) : (
            <div className="space-y-2">
              {results.map((task) => (
                <div key={task.id} onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: PriorityColors[task.priority] }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{PriorityLabels[task.priority]}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{StatusLabels[task.status]}</span>
                      {task.dueDate && (
                        <><span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'd MMM yyyy', { locale: tr })}</span></>
                      )}
                    </div>
                  </div>
                  {task.tags.map((tag) => (
                    <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
