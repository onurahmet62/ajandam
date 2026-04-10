import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTaskStore } from '../stores/taskStore';
import { PriorityColors, type TodoTask } from '../lib/types';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { Plus, Filter, X } from 'lucide-react';

const locales = { 'tr': tr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const messages = {
  allDay: 'Tüm gün',
  previous: 'Geri',
  next: 'İleri',
  today: 'Bugün',
  month: 'Ay',
  week: 'Hafta',
  day: 'Gün',
  agenda: 'Ajanda',
  date: 'Tarih',
  time: 'Saat',
  event: 'Etkinlik',
  noEventsInRange: 'Bu aralıkta etkinlik yok.',
  showMore: (total: number) => `+${total} daha`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TodoTask;
}

export default function CalendarPage() {
  const { tasks, tags, fetchTasksByRange, fetchTags } = useTaskStore();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (tags.length === 0) fetchTags();
  }, []);

  useEffect(() => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    fetchTasksByRange(start, end);
  }, [date]);

  const filteredTasks = useMemo(() => {
    if (filterTagIds.length === 0) return tasks;
    return tasks.filter((t) =>
      t.tags.some((tag) => filterTagIds.includes(tag.id))
    );
  }, [tasks, filterTagIds]);

  const events: CalendarEvent[] = useMemo(() =>
    filteredTasks.filter((t) => t.startDate || t.dueDate).map((t) => ({
      id: t.id,
      title: t.title,
      start: new Date(t.startDate || t.dueDate!),
      end: new Date(t.endDate || t.dueDate || t.startDate!),
      resource: t,
    })),
  [filteredTasks]);

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: PriorityColors[event.resource.priority],
      color: '#4a5568',
      borderRadius: '8px',
      border: 'none',
      padding: '2px 6px',
      fontSize: '12px',
    },
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedTask(event.resource);
    setShowEditModal(true);
  };

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSlotStart(slotInfo.start);
    setSlotEnd(slotInfo.end);
    setShowCreateModal(true);
  }, []);

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    fetchTasksByRange(start, end);
  };

  const toggleFilterTag = (id: string) => {
    setFilterTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Takvim</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              filterTagIds.length > 0
                ? 'border-[var(--theme-color)] text-[var(--theme-color)] bg-[color-mix(in_srgb,var(--theme-color)_8%,white)]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtre
            {filterTagIds.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-color)' }}>
                {filterTagIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setSlotStart(new Date());
              setSlotEnd(new Date());
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-color)' }}
          >
            <Plus size={18} />
            Yeni Görev
          </button>
        </div>
      </div>

      {/* Tag filter bar */}
      {showFilter && (
        <div className="mb-4 p-3 bg-white rounded-xl border border-gray-100 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Etiketlere göre filtrele</span>
            {filterTagIds.length > 0 && (
              <button
                onClick={() => setFilterTagIds([])}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X size={12} /> Temizle
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && (
              <span className="text-sm text-gray-400">Henüz etiket yok</span>
            )}
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleFilterTag(tag.id)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: filterTagIds.includes(tag.id) ? tag.color : 'transparent',
                  color: filterTagIds.includes(tag.id) ? 'white' : '#6b7280',
                  border: `2px solid ${tag.color}`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: filterTagIds.includes(tag.id) ? 'white' : tag.color,
                  }}
                />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 calendar-slot-hover" style={{ height: 'calc(100vh - 200px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          messages={messages}
          culture="tr"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
        />
      </div>

      {showEditModal && selectedTask && (
        <TaskModal task={selectedTask} onClose={() => { setShowEditModal(false); setSelectedTask(null); }} />
      )}

      {showCreateModal && (
        <CreateTaskModal
          initialStart={slotStart}
          initialEnd={slotEnd}
          onClose={handleCloseCreate}
        />
      )}
    </div>
  );
}
