import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTaskStore } from '../stores/taskStore';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { PriorityColors, GroupRole, type TodoTask, type GroupTask } from '../lib/types';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import GroupTaskModal from '../components/GroupTaskModal';
import { Plus, Filter, X, Users } from 'lucide-react';

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

const GROUP_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TodoTask | null;
  groupTask: GroupTask | null;
  isGroupTask: boolean;
}

export default function CalendarPage() {
  const { tasks, tags, fetchTasksByRange, fetchTags } = useTaskStore();
  const { myGroupTasks, fetchMyGroupTasks, groups, fetchGroups } = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [selectedGroupTask, setSelectedGroupTask] = useState<GroupTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupTaskModal, setShowGroupTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [filterGroupIds, setFilterGroupIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (tags.length === 0) fetchTags();
    if (groups.length === 0) fetchGroups();
  }, []);

  useEffect(() => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    fetchTasksByRange(start, end);
    fetchMyGroupTasks(start, end);
  }, [date]);

  const filteredTasks = useMemo(() => {
    if (filterTagIds.length === 0) return tasks;
    return tasks.filter((t) =>
      t.tags.some((tag) => filterTagIds.includes(tag.id))
    );
  }, [tasks, filterTagIds]);

  const filteredGroupTasks = useMemo(() => {
    if (filterGroupIds.length === 0) return myGroupTasks;
    return myGroupTasks.filter((t) => filterGroupIds.includes(t.groupId));
  }, [myGroupTasks, filterGroupIds]);

  // Build a color map for groups
  const groupColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const uniqueGroupIds = [...new Set(myGroupTasks.map((t) => t.groupId))];
    uniqueGroupIds.forEach((id, i) => { map[id] = GROUP_COLORS[i % GROUP_COLORS.length]; });
    return map;
  }, [myGroupTasks]);

  const events: CalendarEvent[] = useMemo(() => {
    const personalEvents: CalendarEvent[] = filteredTasks
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: new Date(t.startDate || t.dueDate!),
        end: new Date(t.endDate || t.dueDate || t.startDate!),
        resource: t,
        groupTask: null,
        isGroupTask: false,
      }));

    const groupEvents: CalendarEvent[] = filteredGroupTasks
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => ({
        id: `group-${t.id}`,
        title: `[${t.groupName}] ${t.title}`,
        start: new Date(t.startDate || t.dueDate!),
        end: new Date(t.endDate || t.dueDate || t.startDate!),
        resource: null,
        groupTask: t,
        isGroupTask: true,
      }));

    return [...personalEvents, ...groupEvents];
  }, [filteredTasks, filteredGroupTasks]);

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.isGroupTask && event.groupTask) {
      const color = groupColorMap[event.groupTask.groupId] || '#8B5CF6';
      return {
        style: {
          backgroundColor: color,
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          padding: '2px 6px',
          fontSize: '12px',
        },
      };
    }
    return {
      style: {
        backgroundColor: event.resource ? PriorityColors[event.resource.priority] : '#A7C7E7',
        color: '#4a5568',
        borderRadius: '8px',
        border: 'none',
        padding: '2px 6px',
        fontSize: '12px',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.isGroupTask && event.groupTask) {
      setSelectedGroupTask(event.groupTask);
      setShowGroupTaskModal(true);
    } else if (event.resource) {
      setSelectedTask(event.resource);
      setShowEditModal(true);
    }
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

  const handleCloseGroupTask = () => {
    setShowGroupTaskModal(false);
    setSelectedGroupTask(null);
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    fetchMyGroupTasks(start, end);
  };

  const toggleFilterTag = (id: string) => {
    setFilterTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleFilterGroup = (id: string) => {
    setFilterGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const isAdminOfGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.members.some((m) => m.userId === user?.id && m.role === GroupRole.Admin) ?? false;
  };

  // Unique groups that have tasks in calendar
  const calendarGroups = useMemo(() => {
    const seen = new Set<string>();
    return myGroupTasks
      .filter((t) => { if (seen.has(t.groupId)) return false; seen.add(t.groupId); return true; })
      .map((t) => ({ id: t.groupId, name: t.groupName || 'Grup' }));
  }, [myGroupTasks]);

  const activeFilterCount = filterTagIds.length + filterGroupIds.length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Takvim</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activeFilterCount > 0
                ? 'border-[var(--theme-color)] text-[var(--theme-color)] bg-[color-mix(in_srgb,var(--theme-color)_8%,white)]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtre
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-color)' }}>
                {activeFilterCount}
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

      {/* Filter bar */}
      {showFilter && (
        <div className="mb-4 p-3 bg-white rounded-xl border border-gray-100 animate-fade-in space-y-3">
          {/* Tag filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Etiketlere göre filtrele</span>
              {filterTagIds.length > 0 && (
                <button onClick={() => setFilterTagIds([])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <X size={12} /> Temizle
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <span className="text-sm text-gray-400">Henüz etiket yok</span>}
              {tags.map((tag) => (
                <button key={tag.id} onClick={() => toggleFilterTag(tag.id)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: filterTagIds.includes(tag.id) ? tag.color : 'transparent',
                    color: filterTagIds.includes(tag.id) ? 'white' : '#6b7280',
                    border: `2px solid ${tag.color}`,
                  }}>
                  <span className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: filterTagIds.includes(tag.id) ? 'white' : tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Group filters */}
          {calendarGroups.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                  <Users size={14} /> Gruplara göre filtrele
                </span>
                {filterGroupIds.length > 0 && (
                  <button onClick={() => setFilterGroupIds([])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <X size={12} /> Temizle
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {calendarGroups.map((g) => {
                  const color = groupColorMap[g.id] || '#8B5CF6';
                  const isActive = filterGroupIds.length === 0 || filterGroupIds.includes(g.id);
                  return (
                    <button key={g.id} onClick={() => toggleFilterGroup(g.id)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: isActive ? color : 'transparent',
                        color: isActive ? 'white' : '#6b7280',
                        border: `2px solid ${color}`,
                        opacity: isActive ? 1 : 0.5,
                      }}>
                      <Users size={12} />
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

      {showGroupTaskModal && selectedGroupTask && (
        <GroupTaskModal
          task={selectedGroupTask}
          isAdmin={isAdminOfGroup(selectedGroupTask.groupId)}
          onClose={handleCloseGroupTask}
        />
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
