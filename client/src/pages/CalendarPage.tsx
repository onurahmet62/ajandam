import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTaskStore } from '../stores/taskStore';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { useSpecialDayStore } from '../stores/specialDayStore';
import { PriorityColors, GroupRole, type TodoTask, type GroupTask, type SpecialDay } from '../lib/types';
import { getStaticHolidays, HOLIDAY_COLORS, type StaticHoliday } from '../lib/turkishHolidays';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import GroupTaskModal from '../components/GroupTaskModal';
import { Plus, Filter, X, Users, Star, Cake, Trash2 } from 'lucide-react';

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

const SPECIAL_DAY_COLORS = [
  '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444',
  '#3B82F6', '#6366F1', '#14B8A6', '#D946EF', '#F97316',
];

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: TodoTask | null;
  groupTask: GroupTask | null;
  isGroupTask: boolean;
  holiday: StaticHoliday | null;
  specialDay: SpecialDay | null;
}

export default function CalendarPage() {
  const { tasks, tags, fetchTasksByRange, fetchTags } = useTaskStore();
  const { myGroupTasks, fetchMyGroupTasks, groups, fetchGroups } = useGroupStore();
  const { specialDays, fetchAll: fetchSpecialDays, create: createSpecialDay, remove: removeSpecialDay } = useSpecialDayStore();
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
  const [showHolidays, setShowHolidays] = useState(true);
  const [showSpecialDays, setShowSpecialDays] = useState(true);
  const [showAddSpecialDay, setShowAddSpecialDay] = useState(false);
  const [newSpecialDay, setNewSpecialDay] = useState({ title: '', date: '', isYearly: true, color: '#EC4899' });
  const [selectedSpecialDay, setSelectedSpecialDay] = useState<SpecialDay | null>(null);

  useEffect(() => {
    if (tags.length === 0) fetchTags();
    if (groups.length === 0) fetchGroups();
    fetchSpecialDays();
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

  const groupColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const uniqueGroupIds = [...new Set(myGroupTasks.map((t) => t.groupId))];
    uniqueGroupIds.forEach((id, i) => { map[id] = GROUP_COLORS[i % GROUP_COLORS.length]; });
    return map;
  }, [myGroupTasks]);

  // Static holidays for visible range
  const staticHolidays = useMemo(() => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    return getStaticHolidays(start, end);
  }, [date]);

  // User special days mapped to current year instances
  const specialDayEvents = useMemo(() => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    const events: { day: SpecialDay; eventDate: Date }[] = [];

    for (const sd of specialDays) {
      const sdDate = new Date(sd.date);
      if (sd.isYearly) {
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
          try {
            const anniversary = new Date(year, sdDate.getMonth(), sdDate.getDate());
            if (anniversary >= start && anniversary <= end) {
              events.push({ day: sd, eventDate: anniversary });
            }
          } catch { /* Feb 29 */ }
        }
      } else {
        if (sdDate >= start && sdDate <= end) {
          events.push({ day: sd, eventDate: sdDate });
        }
      }
    }
    return events;
  }, [specialDays, date]);

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
        holiday: null,
        specialDay: null,
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
        holiday: null,
        specialDay: null,
      }));

    const holidayEvents: CalendarEvent[] = showHolidays
      ? staticHolidays.map((h, i) => ({
          id: `holiday-${i}`,
          title: h.name,
          start: h.start,
          end: h.end,
          allDay: true,
          resource: null,
          groupTask: null,
          isGroupTask: false,
          holiday: h,
          specialDay: null,
        }))
      : [];

    const sdEvents: CalendarEvent[] = showSpecialDays
      ? specialDayEvents.map((e) => ({
          id: `special-${e.day.id}-${e.eventDate.getFullYear()}`,
          title: `⭐ ${e.day.title}`,
          start: e.eventDate,
          end: e.eventDate,
          allDay: true,
          resource: null,
          groupTask: null,
          isGroupTask: false,
          holiday: null,
          specialDay: e.day,
        }))
      : [];

    return [...holidayEvents, ...sdEvents, ...personalEvents, ...groupEvents];
  }, [filteredTasks, filteredGroupTasks, staticHolidays, specialDayEvents, showHolidays, showSpecialDays]);

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.holiday) {
      const color = HOLIDAY_COLORS[event.holiday.type];
      return {
        style: {
          backgroundColor: color,
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 600,
          opacity: 0.9,
        },
      };
    }
    if (event.specialDay) {
      return {
        style: {
          backgroundColor: event.specialDay.color,
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 600,
        },
      };
    }
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
    if (event.holiday) return; // Static holidays are not editable
    if (event.specialDay) {
      setSelectedSpecialDay(event.specialDay);
      return;
    }
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

  const calendarGroups = useMemo(() => {
    const seen = new Set<string>();
    return myGroupTasks
      .filter((t) => { if (seen.has(t.groupId)) return false; seen.add(t.groupId); return true; })
      .map((t) => ({ id: t.groupId, name: t.groupName || 'Grup' }));
  }, [myGroupTasks]);

  const handleAddSpecialDay = async () => {
    if (!newSpecialDay.title || !newSpecialDay.date) return;
    await createSpecialDay(newSpecialDay);
    setNewSpecialDay({ title: '', date: '', isYearly: true, color: '#EC4899' });
    setShowAddSpecialDay(false);
  };

  const handleDeleteSpecialDay = async (id: string) => {
    await removeSpecialDay(id);
    setSelectedSpecialDay(null);
  };

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
            onClick={() => setShowAddSpecialDay(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Cake size={16} />
            Özel Gün
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

          {/* Holidays & Special Days toggle */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showHolidays} onChange={() => setShowHolidays(!showHolidays)}
                className="rounded border-gray-300" />
              <Star size={14} className="text-red-500" /> Resmi tatiller & özel günler
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showSpecialDays} onChange={() => setShowSpecialDays(!showSpecialDays)}
                className="rounded border-gray-300" />
              <Cake size={14} className="text-pink-500" /> Kişisel özel günler
            </label>
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

      {/* Add Special Day Modal */}
      {showAddSpecialDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSpecialDay(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Cake size={20} className="text-pink-500" /> Özel Gün Ekle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Başlık</label>
                <input
                  type="text"
                  placeholder="Doğum günüm, Yıldönümü..."
                  value={newSpecialDay.title}
                  onChange={(e) => setNewSpecialDay({ ...newSpecialDay, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tarih</label>
                <input
                  type="date"
                  value={newSpecialDay.date}
                  onChange={(e) => setNewSpecialDay({ ...newSpecialDay, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_DAY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewSpecialDay({ ...newSpecialDay, color: c })}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        border: newSpecialDay.color === c ? '3px solid #1f2937' : '3px solid transparent',
                        transform: newSpecialDay.color === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSpecialDay.isYearly}
                  onChange={(e) => setNewSpecialDay({ ...newSpecialDay, isYearly: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Her yıl tekrarla
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddSpecialDay(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleAddSpecialDay}
                disabled={!newSpecialDay.title || !newSpecialDay.date}
                className="px-4 py-2 text-sm text-white rounded-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: newSpecialDay.color }}
              >
                Kaydet
              </button>
            </div>

            {/* Existing special days list */}
            {specialDays.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Kayıtlı Özel Günler</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specialDays.map((sd) => (
                    <div key={sd.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sd.color }} />
                        <span className="text-sm text-gray-700">{sd.title}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(sd.date).toLocaleDateString('tr-TR')}
                        </span>
                        {sd.isYearly && <span className="text-xs text-gray-400">(her yıl)</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteSpecialDay(sd.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Day Detail Popup */}
      {selectedSpecialDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSpecialDay(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedSpecialDay.color }} />
              <h2 className="text-lg font-bold text-gray-800">{selectedSpecialDay.title}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(selectedSpecialDay.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {selectedSpecialDay.isYearly && (
              <p className="text-xs text-gray-400">Her yıl tekrarlanır</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { handleDeleteSpecialDay(selectedSpecialDay.id); }}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1"
              >
                <Trash2 size={14} /> Sil
              </button>
              <button
                onClick={() => setSelectedSpecialDay(null)}
                className="px-4 py-2 text-sm text-white rounded-xl transition-all"
                style={{ backgroundColor: selectedSpecialDay.color }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
