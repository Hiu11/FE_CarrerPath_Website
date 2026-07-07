import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable } from '../components/DataTable';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface Skill {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Resource {
  _id: string;
  title: string;
  type: string;
  url: string;
  skillId: string;
}

export const AdminSkillsPage = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Skill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit/Create Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Skill | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Resource Management inside Edit Skill State
  const [skillResources, setSkillResources] = useState<Resource[]>([]);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('EXTERNAL DOC');
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [isSavingResource, setIsSavingResource] = useState(false);

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getSkills();
      setSkills(data);
    } catch (error) {
      toast.error('Failed to fetch skills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkillResources = async (skillId: string) => {
    try {
      const response = await adminApi.getResources({ skillId });
      setSkillResources(response.data);
    } catch (error) {
      toast.error('Failed to fetch linked resources');
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [skills, searchQuery]);

  const handleAddNewClick = () => {
    setModalMode('create');
    setEditingItem(null);
    setSkillName('');
    setSkillDescription('');
    setSkillResources([]);
    setEditingResId(null);
    setResTitle('');
    setResUrl('');
    setResType('EXTERNAL DOC');
    setEditModalOpen(true);
  };

  const handleEditClick = (item: Skill) => {
    setModalMode('edit');
    setEditingItem(item);
    setSkillName(item.name);
    setSkillDescription(item.description || '');
    setSkillResources([]);
    setEditingResId(null);
    setResTitle('');
    setResUrl('');
    setResType('EXTERNAL DOC');
    setEditModalOpen(true);
    fetchSkillResources(item._id);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      toast.error('Skill name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await adminApi.createSkill({
          name: skillName.trim(),
          slug,
          description: skillDescription.trim()
        });
        toast.success('Skill created successfully');
      } else {
        if (!editingItem) return;
        await adminApi.updateSkill(editingItem._id, {
          name: skillName.trim(),
          description: skillDescription.trim()
        });
        toast.success('Skill updated successfully');
      }
      setEditModalOpen(false);
      fetchSkills();
    } catch (error) {
      toast.error(`Failed to ${modalMode} skill`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add/Update resource directly from the skill edit overlay
  const handleAddOrUpdateResource = async () => {
    if (!editingItem) return;
    if (!resTitle.trim() || !resUrl.trim()) {
      toast.error('Resource Title and URL are required');
      return;
    }

    // Basic URL validation
    if (!resUrl.startsWith('http://') && !resUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    setIsSavingResource(true);
    try {
      const payload = {
        title: resTitle.trim(),
        type: resType,
        url: resUrl.trim(),
        skillId: editingItem._id
      };

      if (editingResId) {
        await adminApi.updateResource(editingResId, payload);
        toast.success('Resource updated successfully');
      } else {
        await adminApi.createResource(payload);
        toast.success('Resource added successfully');
      }

      // Reset resource fields
      setEditingResId(null);
      setResTitle('');
      setResUrl('');
      setResType('EXTERNAL DOC');
      
      // Refresh resources
      fetchSkillResources(editingItem._id);
    } catch (error) {
      toast.error('Failed to save resource');
    } finally {
      setIsSavingResource(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!editingItem) return;
    try {
      await adminApi.deleteResource(resourceId);
      toast.success('Resource removed successfully');
      fetchSkillResources(editingItem._id);
    } catch (error) {
      toast.error('Failed to remove resource');
    }
  };

  const handleDeleteRequest = (item: Skill) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteSkill(itemToDelete._id);
      toast.success('Skill deleted successfully');
      fetchSkills();
    } catch (error) {
      toast.error('Failed to delete skill');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { 
      key: 'slug', 
      header: 'Slug',
      render: (item: Skill) => (
        <span className="font-mono text-xs text-amber-400 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/10">
          {item.slug}
        </span>
      )
    },
    { 
      key: 'description', 
      header: 'Description',
      render: (item: Skill) => (
        <span className="truncate max-w-md block text-slate-400" title={item.description || ''}>
          {item.description || '-'}
        </span>
      )
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
          Admin &gt; Skill Library
        </p>
        <h1 className="text-3xl font-extrabold text-white uppercase">Skills Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage global learning skills, definitions, and categories.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredSkills}
        keyExtractor={(item) => item._id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search skills by name or slug..."
        onAddNew={handleAddNewClick}
        addButtonLabel="Add Skill"
        onEdit={handleEditClick}
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Skill"
        description={`Are you sure you want to delete the skill "${itemToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {/* Edit/Create Dialog Overlay */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f0f11] border border-slate-800 rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-extrabold text-white mb-6 uppercase">
              {modalMode === 'create' ? 'Add New Skill' : 'Edit Skill'}
            </h2>
            
            <form onSubmit={handleSaveSkill} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Skill Name</label>
                <input 
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm"
                  placeholder="e.g. Docker, React Router"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                <textarea 
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 text-sm min-h-[90px]"
                  placeholder="Explain what this skill entails..."
                />
              </div>

              {/* Linked Resources Integration (Only in Edit Mode) */}
              {modalMode === 'edit' && (
                <div className="border-t border-slate-800 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Linked Learning Resources</h3>
                  
                  {/* Resources List */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {skillResources.map((res) => (
                      <div key={res._id} className="flex justify-between items-center bg-[#0a0a0b] border border-slate-800 p-2.5 rounded text-xs">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/5 border border-amber-400/10 px-1.5 py-0.5 rounded mr-2 tracking-wide">
                            {res.type}
                          </span>
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-bold text-slate-200 hover:text-white underline truncate block max-w-xs mt-1"
                          >
                            {res.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingResId(res._id);
                              setResTitle(res.title);
                              setResUrl(res.url);
                              setResType(res.type);
                            }}
                            className="text-amber-400 hover:bg-slate-800 px-2 py-1 rounded transition text-[11px] font-bold"
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveResource(res._id)}
                            className="text-red-400 hover:bg-slate-800 px-2 py-1 rounded transition text-[11px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {skillResources.length === 0 && (
                      <p className="text-xs text-slate-500 font-semibold py-1">No learning resources linked to this skill yet.</p>
                    )}
                  </div>

                  {/* Resource Creation/Edit Form */}
                  <div className="bg-[#0a0a0b] border border-slate-800 rounded p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {editingResId ? 'Modify Linked Resource' : 'Attach New Learning Resource'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        value={resTitle}
                        onChange={(e) => setResTitle(e.target.value)}
                        className="bg-transparent border-b border-slate-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        placeholder="Resource Title (e.g. Guide)"
                      />
                      <input 
                        value={resUrl}
                        onChange={(e) => setResUrl(e.target.value)}
                        className="bg-transparent border-b border-slate-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        placeholder="URL (e.g. https://...)"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <select 
                        value={resType}
                        onChange={(e) => setResType(e.target.value)}
                        className="bg-slate-900 border border-slate-850 rounded p-1.5 text-xs font-bold text-slate-300 focus:outline-none"
                      >
                        <option value="INTERNAL COURSE">INTERNAL COURSE</option>
                        <option value="EXTERNAL DOC">EXTERNAL DOC</option>
                        <option value="VIDEO TUTORIAL">VIDEO TUTORIAL</option>
                      </select>
                      <div className="flex gap-2">
                        {editingResId && (
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingResId(null);
                              setResTitle('');
                              setResUrl('');
                              setResType('EXTERNAL DOC');
                            }}
                            className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={handleAddOrUpdateResource}
                          disabled={isSavingResource}
                          className="text-xs font-extrabold text-amber-400 hover:text-amber-300 disabled:opacity-55"
                        >
                          {editingResId ? 'Update Link' : 'Attach Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  {isSaving ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
