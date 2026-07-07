import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable } from '../components/DataTable';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';
import { X, ExternalLink } from 'lucide-react';

interface Skill {
  _id: string;
  name: string;
}

interface Resource {
  _id: string;
  title: string;
  type: string;
  url: string;
  skillId: string | Skill;
}

export const AdminResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit/Create modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Resource | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('EXTERNAL DOC');
  const [resUrl, setResUrl] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resResponse, skillsResponse] = await Promise.all([
        adminApi.getResources(),
        adminApi.getSkills()
      ]);
      setResources(resResponse.data);
      setSkills(skillsResponse.data);
    } catch (error) {
      toast.error('Failed to load resources page data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const skillName = typeof res.skillId === 'object' ? res.skillId?.name : skills.find(s => s._id === res.skillId)?.name;
      return (
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skillName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [resources, searchQuery, skills]);

  const handleAddNewClick = () => {
    if (skills.length === 0) {
      toast.error('You need to create at least one skill in the Skill Library before adding resources.');
      return;
    }
    setModalMode('create');
    setEditingItem(null);
    setResTitle('');
    setResType('EXTERNAL DOC');
    setResUrl('');
    setSelectedSkillId(skills[0]?._id || '');
    setEditModalOpen(true);
  };

  const handleEditClick = (item: Resource) => {
    setModalMode('edit');
    setEditingItem(item);
    setResTitle(item.title);
    setResType(item.type);
    setResUrl(item.url);
    setSelectedSkillId(typeof item.skillId === 'object' ? item.skillId?._id : item.skillId);
    setEditModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim() || !selectedSkillId) {
      toast.error('All fields are required');
      return;
    }

    // Basic URL validation
    if (!resUrl.startsWith('http://') && !resUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: resTitle.trim(),
        type: resType,
        url: resUrl.trim(),
        skillId: selectedSkillId
      };

      if (modalMode === 'create') {
        await adminApi.createResource(payload);
        toast.success('Learning resource created successfully');
      } else {
        if (!editingItem) return;
        await adminApi.updateResource(editingItem._id, payload);
        toast.success('Learning resource updated successfully');
      }
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${modalMode} resource`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (item: Resource) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteResource(itemToDelete._id);
      toast.success('Resource deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = [
    { key: 'title', header: 'Resource Title' },
    { 
      key: 'type', 
      header: 'Type',
      render: (item: Resource) => (
        <span className="text-xs font-bold text-amber-400 bg-amber-400/5 px-2.5 py-1 rounded border border-amber-400/10">
          {item.type}
        </span>
      )
    },
    { 
      key: 'url', 
      header: 'Link',
      render: (item: Resource) => (
        <a 
          href={item.url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white underline"
        >
          View Link <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )
    },
    { 
      key: 'skillId', 
      header: 'Linked Skill',
      render: (item: Resource) => {
        const name = typeof item.skillId === 'object' ? item.skillId?.name : skills.find(s => s._id === item.skillId)?.name;
        return <span className="font-bold text-slate-200">{name || 'Unknown Skill'}</span>;
      }
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
          Admin &gt; Resources
        </p>
        <h1 className="text-3xl font-extrabold text-white uppercase">Learning Resources</h1>
        <p className="text-sm text-slate-400 mt-1">Manage external document links, internal courses, and videos mapped to skills.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredResources}
        keyExtractor={(item) => item._id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search resources by title, type, or skill..."
        onAddNew={handleAddNewClick}
        addButtonLabel="Add Resource"
        onEdit={handleEditClick}
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Resource"
        description={`Are you sure you want to delete the resource "${itemToDelete?.title}"?`}
        isDeleting={isDeleting}
      />

      {/* Edit/Create Dialog Overlay */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f11] border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setEditModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-white mb-6 uppercase">
              {modalMode === 'create' ? 'Add New Resource' : 'Edit Resource'}
            </h2>
            <form onSubmit={handleSaveResource} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Resource Title</label>
                <input 
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm"
                  placeholder="e.g. React Official Tutorial, Docker Basics"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Resource Type</label>
                  <select 
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm appearance-none"
                  >
                    <option value="INTERNAL COURSE">INTERNAL COURSE</option>
                    <option value="EXTERNAL DOC">EXTERNAL DOC</option>
                    <option value="VIDEO TUTORIAL">VIDEO TUTORIAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Linked Skill</label>
                  <select 
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm appearance-none"
                  >
                    {skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">URL Link</label>
                <input 
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm"
                  placeholder="e.g. https://react.dev/learn"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded bg-amber-400 text-black font-extrabold text-sm hover:bg-amber-500 transition shadow-md disabled:opacity-55"
                >
                  {isSaving ? 'Saving...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
