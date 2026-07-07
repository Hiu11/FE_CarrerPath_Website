import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable } from '../components/DataTable';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';

interface Roadmap {
  _id: string;
  careerId: string;
  careerTitle: string;
  description: string;
}

export const AdminRoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Roadmap | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoadmaps = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getRoadmaps();
      setRoadmaps(data);
    } catch (error) {
      toast.error('Failed to fetch roadmaps');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((roadmap) =>
      roadmap.careerTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roadmap.careerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roadmaps, searchQuery]);

  const handleAddNew = async () => {
    const careerTitle = window.prompt('Enter roadmap career title:');
    if (!careerTitle) return;
    const careerId = careerTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const description = window.prompt('Enter roadmap description:');
    
    try {
      await adminApi.createRoadmap({ 
        careerTitle, 
        careerId, 
        description: description || '',
        skills: [],
        roadmapSteps: []
      });
      toast.success('Roadmap created successfully');
      fetchRoadmaps();
    } catch (error) {
      toast.error('Failed to create roadmap');
    }
  };

  const handleEdit = async (item: Roadmap) => {
    const careerTitle = window.prompt('Edit roadmap career title:', item.careerTitle);
    if (!careerTitle) return;
    const description = window.prompt('Edit roadmap description:', item.description);
    
    try {
      await adminApi.updateRoadmap(item._id, { careerTitle, description });
      toast.success('Roadmap updated successfully');
      fetchRoadmaps();
    } catch (error) {
      toast.error('Failed to update roadmap');
    }
  };

  const handleDeleteRequest = (item: Roadmap) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteRoadmap(itemToDelete._id);
      toast.success('Roadmap deleted successfully');
      fetchRoadmaps();
    } catch (error) {
      toast.error('Failed to delete roadmap');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = [
    { key: 'careerTitle', header: 'Career Title' },
    { key: 'careerId', header: 'Career ID' },
    { 
      key: 'description', 
      header: 'Description',
      render: (item: Roadmap) => (
        <span className="truncate max-w-xs block" title={item.description}>
          {item.description}
        </span>
      )
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
          Admin &gt; Roadmaps
        </p>
        <h1 className="text-3xl font-extrabold text-white uppercase">Roadmaps Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage learning roadmaps and their steps.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredRoadmaps}
        keyExtractor={(item) => item._id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search roadmaps by title or ID..."
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Roadmap"
        description={`Are you sure you want to delete the roadmap for "${itemToDelete?.careerTitle}"?`}
        isDeleting={isDeleting}
      />
    </div>
  );
};
