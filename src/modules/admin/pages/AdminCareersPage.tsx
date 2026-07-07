import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable } from '../components/DataTable';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';

interface Career {
  _id: string;
  careerId: string;
  title: string;
  description: string;
}

export const AdminCareersPage = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Career | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state (Simple implementation using window.prompt for now, or you could create a full modal form)
  // For standard admin panels, a separate page or a full modal is better.
  
  const fetchCareers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getCareers();
      setCareers(data);
    } catch (error) {
      toast.error('Failed to fetch careers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const filteredCareers = useMemo(() => {
    return careers.filter((career) =>
      career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.careerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [careers, searchQuery]);

  const handleAddNew = async () => {
    const title = window.prompt('Enter career title:');
    if (!title) return;
    const careerId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const description = window.prompt('Enter career description:');
    
    try {
      await adminApi.createCareer({ title, careerId, description: description || '' });
      toast.success('Career created successfully');
      fetchCareers();
    } catch (error) {
      toast.error('Failed to create career');
    }
  };

  const handleEdit = async (item: Career) => {
    const title = window.prompt('Edit career title:', item.title);
    if (!title) return;
    const description = window.prompt('Edit career description:', item.description);
    
    try {
      await adminApi.updateCareer(item._id, { title, description });
      toast.success('Career updated successfully');
      fetchCareers();
    } catch (error) {
      toast.error('Failed to update career');
    }
  };

  const handleDeleteRequest = (item: Career) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCareer(itemToDelete._id);
      toast.success('Career deleted successfully');
      fetchCareers();
    } catch (error) {
      toast.error('Failed to delete career');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = [
    { key: 'careerId', header: 'Career ID' },
    { key: 'title', header: 'Title' },
    { 
      key: 'description', 
      header: 'Description',
      render: (item: Career) => (
        <span className="truncate max-w-xs block" title={item.description}>
          {item.description}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono uppercase tracking-wider text-foreground">Careers Management</h1>
        <p className="text-sm font-mono text-muted-foreground mt-1">Manage career paths, titles, and descriptions.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredCareers}
        keyExtractor={(item) => item._id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search careers by title or ID..."
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Career"
        description={`Are you sure you want to delete the career "${itemToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};
