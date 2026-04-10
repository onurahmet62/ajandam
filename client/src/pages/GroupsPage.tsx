import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Users, Crown, User, Mail, Copy, Check, LogOut, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { GroupRole, PriorityLabels, StatusLabels, type Group, type GroupMember } from '../lib/types';
import GroupTaskModal from '../components/GroupTaskModal';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const {
    groups, groupTasks, fetchGroups, fetchGroupTasks, deleteGroup,
    updateMemberRole, leaveGroup, deleteGroupTask
  } = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (selectedGroup) fetchGroupTasks(selectedGroup.id);
  }, [selectedGroup]);

  // Refresh selected group data from groups list
  useEffect(() => {
    if (selectedGroup) {
      const updated = groups.find((g) => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    }
  }, [groups]);

  const isAdmin = selectedGroup?.members.some((m) => m.userId === user?.id && m.role === GroupRole.Admin) ?? false;

  const handleLeave = async () => {
    if (!selectedGroup) return;
    if (!confirm('Bu gruptan ayrılmak istediğinize emin misiniz?')) return;
    try {
      await leaveGroup(selectedGroup.id);
      setSelectedGroup(null);
      toast.success('Gruptan ayrıldınız');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gruptan ayrılamadınız';
      toast.error(msg);
    }
  };

  const handleRoleChange = async (member: GroupMember) => {
    if (!selectedGroup) return;
    const newRole = member.role === GroupRole.Admin ? GroupRole.Member : GroupRole.Admin;
    const label = newRole === GroupRole.Admin ? 'Yönetici' : 'Üye';
    if (!confirm(`${member.fullName} kullanıcısını ${label} yapmak istediğinize emin misiniz?`)) return;
    try {
      await updateMemberRole(selectedGroup.id, member.userId, newRole);
      await fetchGroups();
      toast.success(`${member.fullName} artık ${label}`);
    } catch {
      toast.error('Rol değiştirilemedi');
    }
  };

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
                  {isAdmin && (
                    <button onClick={() => setShowInvite(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                      <UserPlus size={16} /> Davet Et
                    </button>
                  )}
                  <button onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90"
                    style={{ backgroundColor: 'var(--theme-color)' }}>
                    <Plus size={16} /> Görev
                  </button>
                  {isAdmin ? (
                    <button onClick={() => { if (confirm('Grubu silmek istediğinize emin misiniz?')) { deleteGroup(selectedGroup.id); setSelectedGroup(null); toast.success('Grup silindi'); } }}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button onClick={handleLeave}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={16} /> Ayrıl
                    </button>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Üyeler</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-sm group">
                      {m.role === GroupRole.Admin ? <Crown size={14} className="text-yellow-500" /> : <User size={14} className="text-gray-400" />}
                      <span className="text-gray-700">{m.fullName}</span>
                      <span className="text-[10px] text-gray-400">{m.role === GroupRole.Admin ? 'Yönetici' : 'Üye'}</span>
                      {isAdmin && m.userId !== user?.id && (
                        <button onClick={() => handleRoleChange(m)}
                          title={m.role === GroupRole.Admin ? 'Üye yap' : 'Yönetici yap'}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                          <Crown size={12} />
                        </button>
                      )}
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
                      <div key={task.id}
                        onClick={() => setSelectedTaskForModal(task)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{PriorityLabels[task.priority]}</span>
                            <span>·</span>
                            <span>{StatusLabels[task.status]}</span>
                            {task.assignedToAll ? (
                              <><span>·</span><span className="text-blue-500">Herkese</span></>
                            ) : task.assignees && task.assignees.length > 0 ? (
                              <><span>·</span><span>→ {task.assignees.map((a) => a.fullName).join(', ')}</span></>
                            ) : task.assignedToUserName && (
                              <><span>·</span><span>→ {task.assignedToUserName}</span></>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'd MMM', { locale: tr })}</span>
                          )}
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Görevi silmek istediğinize emin misiniz?')) { deleteGroupTask(selectedGroup.id, task.id); toast.success('Görev silindi'); } }}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
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
        <CreateGroupTaskModal groupId={selectedGroup.id} members={selectedGroup.members} onClose={() => { setShowCreateTask(false); fetchGroupTasks(selectedGroup.id); }} />
      )}
      {showInvite && selectedGroup && (
        <InviteModal groupId={selectedGroup.id} onClose={() => { setShowInvite(false); fetchGroups(); }} />
      )}
      {selectedTaskForModal && (
        <GroupTaskModal
          task={selectedTaskForModal}
          isAdmin={isAdmin}
          onClose={() => { setSelectedTaskForModal(null); if (selectedGroup) fetchGroupTasks(selectedGroup.id); }}
        />
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

function InviteModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { inviteByEmail } = useGroupStore();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResultMessage('');
    setInviteLink('');
    try {
      const result = await inviteByEmail(groupId, email);
      setResultMessage(result.message);
      if (result.invitationLink) {
        setInviteLink(`${window.location.origin}${result.invitationLink}`);
      }
      if (result.addedDirectly) {
        toast.success(result.message);
        setEmail('');
      }
    } catch {
      toast.error('Davet gönderilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail size={20} /> Üye Davet Et
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">E-posta Adresi</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
              placeholder="ornek@mail.com" />
          </div>

          {resultMessage && (
            <div className="p-3 rounded-xl bg-blue-50 text-sm text-blue-700">
              {resultMessage}
            </div>
          )}

          {inviteLink && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Davet Linki</label>
              <div className="flex gap-2">
                <input readOnly value={inviteLink}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate" />
                <button type="button" onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Bu linki davet etmek istediğiniz kişiyle paylaşın. Link 7 gün geçerlidir.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Kapat</button>
            <button type="submit" disabled={saving || !email.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-color)' }}>
              {saving ? 'Gönderiliyor...' : 'Davet Et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateGroupTaskModal({ groupId, members, onClose }: { groupId: string; members: GroupMember[]; onClose: () => void }) {
  const { createGroupTask } = useGroupStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [assignedToAll, setAssignedToAll] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createGroupTask(groupId, {
        title, description: description || undefined, priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assignedToAll,
        assigneeUserIds: assignedToAll ? undefined : selectedMembers,
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
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Tarih</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent" />
            </div>
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Atama</label>
            <div className="flex gap-3 mb-3">
              <button type="button" onClick={() => setAssignedToAll(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                  assignedToAll ? 'border-[var(--theme-color)] text-[var(--theme-color)] bg-[color-mix(in_srgb,var(--theme-color)_8%,white)]' : 'border-gray-200 text-gray-500'
                }`}>
                <Users size={14} className="inline mr-1" /> Herkese
              </button>
              <button type="button" onClick={() => setAssignedToAll(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                  !assignedToAll ? 'border-[var(--theme-color)] text-[var(--theme-color)] bg-[color-mix(in_srgb,var(--theme-color)_8%,white)]' : 'border-gray-200 text-gray-500'
                }`}>
                <User size={14} className="inline mr-1" /> Belirli Üyelere
              </button>
            </div>
            {!assignedToAll && (
              <div className="space-y-1.5">
                {members.map((m) => (
                  <label key={m.userId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedMembers.includes(m.userId)}
                      onChange={() => toggleMember(m.userId)}
                      className="rounded border-gray-300" style={{ accentColor: 'var(--theme-color)' }} />
                    <span className="text-sm text-gray-700">{m.fullName}</span>
                    {m.role === GroupRole.Admin && <Crown size={12} className="text-yellow-500" />}
                  </label>
                ))}
              </div>
            )}
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
