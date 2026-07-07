import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface CareerPath {
  _id: string;
  pathName: string;
  department: string;
  description: string;
}

export const CareerPathsPage = () => {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CareerPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCareerPaths = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getCareerPaths();
      setCareerPaths(response.data);
    } catch (error) {
      toast.error('Failed to fetch career paths');
      setCareerPaths([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerPaths();
  }, []);

  const filteredPaths = useMemo(() => {
    return careerPaths.filter((path: any) => {
      const nameMatch = (path.pathName || path.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = (path.department || 'Legacy').toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || deptMatch;
    });
  }, [careerPaths, searchQuery]);

  const handleDeleteRequest = (item: CareerPath) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCareerPath(itemToDelete._id);
      toast.success('Career path deleted successfully');
      fetchCareerPaths();
    } catch (error) {
      toast.error('Failed to delete career path');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
            Admin &gt; Career Paths
          </p>
          <h1 className="text-3xl font-extrabold text-white uppercase">CAREER PATHS MANAGEMENT</h1>
        </div>
        <div>
          <button 
            onClick={() => navigate('/admin/career-paths/new')}
            className="flex items-center px-6 py-2 rounded bg-amber-400 text-black font-extrabold hover:bg-amber-500 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Path
          </button>
        </div>
      </div>

      <div className="bg-[#0f0f11] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search career paths..."
              className="w-full bg-[#0a0a0b] border border-slate-700 rounded py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1a1a1c] text-xs font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Path Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-semibold">
                    Loading career paths...
                  </td>
                </tr>
              ) : filteredPaths.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-semibold">
                    No career paths found. Create one!
                  </td>
                </tr>
              ) : (
                filteredPaths.map((path) => (
                  <tr key={path._id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{path.pathName || (path as any).title || 'Untitled'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {path.department || 'Legacy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs" title={path.description}>
                      {path.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/career-paths/${path._id}`)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRequest(path)}
                          className="p-2 bg-slate-800 hover:bg-red-900/50 text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Career Path"
        description={`Are you sure you want to delete the career path "${itemToDelete?.pathName}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};
