import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Users, Crown, User } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { GroupRole, PriorityLabels, StatusLabels, type Group } from '../lib/types';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const { groups, groupTasks, fetchGroups, fetchGroupTasks, deleteGroup } = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (selectedGroup) fetchGroupTasks(selectedGroup.id);
  }, [selectedGroup]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gruplar</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-color)' }}>
          <Plus size={18} /> Yeni Grup
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group list */}
        <div className="lg:col-span-1 space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Henüz grup yok</div>
          ) : (
            groups.map((group) => (
              <div key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                  selectedGroup?.id === group.id ? 'border-[var(--theme-color)] shadow-sm' : 'border-gray-100'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{group.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={14} /> {group.members.length}
                  </div>
                </div>
                {group.description && <p className="text-xs text-gray-500 mt-1">{group.description}</p>}
                <div className="flex -space-x-2 mt-3">
                  {group.members.slice(0, 5).map((m) => (
                    <div key={m.userId}
                      className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600"
                      title={m.fullName}>
                      {m.fullName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedGroup.name}</h2>
                  {selectedGroup.description && <p className="text-sm text-gray-500 mt-1">{selectedGroup.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90"
                    style={{ backgroundColor: 'var(--theme-color)' }}>
                    <Plus size={16} /> Görev
                  </button>
                  {selectedGroup.members.some((m) => m.userId === user?.id && m.role === GroupRole.Admin) && (
                    <button onClick={() => { if (confirm('Grubu silmek istediğinize emin misiniz?')) { deleteGroup(selectedGroup.id); setSelectedGroup(null); toast.success('Grup silindi'); } }}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Üyeler</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-sm">
                      {m.role === GroupRole.Admin ? <Crown size={14} className="text-yellow-500" /> : <User size={14} className="text-gray-400" />}
                      <span className="text-gray-700">{m.fullName}</span>
                      <span className="text-[10px] text-gray-400">{m.role === GroupRole.Admin ? 'Yönetici' : 'Üye'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group tasks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Görevler</h3>
                {groupTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">Henüz görev yok</p>
                ) : (
                  <div className="space-y-2">
                    {groupTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{PriorityLabels[task.priority]}</span>
                            <span>·</span>
                            <span>{StatusLabels[task.status]}</span>
                            {task.assignedToUserName && (
                              <><span>·</span><span>→ {task.assignedToUserName}</span></>
                            )}
                          </div>
                        </div>
                        {task.dueDate && (
                          <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'd MMM', { locale: tr })}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Bir grup seçin</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
      {showCreateTask && selectedGroup && (
        <CreateGroupTaskModal groupId={selectedGroup.id} members={selectedGroup.members} onClose={() => setShowCreateTask(false)} />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { createGroup } = useGroupStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createGroup(name, description || undefined);
      toast.success('Grup oluşturuldu');
      onClose();
    } catch { toast.error('Grup oluşturulamadı'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Grup</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Grup Adı</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
              placeholder="Grup adı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none"
              placeholder="İsteğe bağlı" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={saving || !name.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>{saving ? 'Oluşturuluyor...' : 'Oluştur'}</button>
        </div>
      </form>
    </div>
  );
}

function CreateGroupTaskModal({ groupId, members, onClose }: { groupId: string; members: any[]; onClose: () => void }) {
  const { createGroupTask } = useGroupStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createGroupTask(groupId, {
        title, description: description || undefined, priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assignedToUserId: assignedTo || undefined,
      });
      toast.success('Görev oluşturuldu');
      onClose();
    } catch { toast.error('Görev oluşturulamadı'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Grup Görevi</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Öncelik</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                {Object.entries(PriorityLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Atanan</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent">
                <option value="">Kimse</option>
                {members.map((m) => (<option key={m.userId} value={m.userId}>{m.fullName}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={saving || !title.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>{saving ? 'Oluşturuluyor...' : 'Oluştur'}</button>
        </div>
      </form>
    </div>
  );
}
