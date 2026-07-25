import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Compass, 
  Layers, 
  RefreshCw, 
  ExternalLink, 
  Sparkles,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface CareerPath {
  _id: string;
  careerId?: string;
  pathName?: string;
  title?: string;
  department?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  levels?: Array<{
    name: string;
    requiredSkills?: Array<{ _id: string; name: string } | string>;
    competencies?: string[];
  }>;
  skillIds?: Array<{ _id: string; name: string } | string>;
}

const DEPARTMENT_BADGES: Record<string, string> = {
  Engineering: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Infrastructure: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Data: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  Design: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  Quality: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Product: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  AI: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  Legacy: 'bg-muted text-muted-foreground border-border'
};

const STATUS_BADGES: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  draft: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  archived: 'bg-rose-500/20 text-rose-500 border-rose-500/30'
};

export const CareerPathsPage = () => {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const navigate = useNavigate();

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CareerPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCareerPaths = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getCareerPaths();
      setCareerPaths(response.data || []);
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

  const handleSeedDefaultPaths = async () => {
    setIsSeeding(true);
    try {
      const { data } = await adminApi.seedCareerPaths();
      toast.success(data.message || 'Default career paths seeded successfully!');
      fetchCareerPaths();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to seed default career paths');
    } finally {
      setIsSeeding(false);
    }
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    careerPaths.forEach(p => {
      if (p.department) set.add(p.department);
    });
    return ['All', ...Array.from(set)];
  }, [careerPaths]);

  const filteredPaths = useMemo(() => {
    return careerPaths.filter((path) => {
      const name = (path.pathName || path.title || '').toLowerCase();
      const dept = (path.department || 'Legacy').toLowerCase();
      const desc = (path.description || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || dept.includes(query) || desc.includes(query);
      const matchesDept = selectedDept === 'All' || (path.department || 'Legacy') === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [careerPaths, searchQuery, selectedDept]);

  // Dynamic stats
  const totalPaths = careerPaths.length;
  const totalDepts = useMemo(() => new Set(careerPaths.map(p => p.department || 'Legacy')).size, [careerPaths]);
  const totalLevels = useMemo(() => {
    return careerPaths.reduce((acc, p) => acc + (p.levels?.length || 0), 0);
  }, [careerPaths]);

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
    <div className="p-8 max-w-7xl mx-auto text-foreground space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link> &gt; <span className="text-foreground">Career Paths</span>
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Compass className="w-8 h-8 text-primary" /> Career Paths Management
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDefaultPaths}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 rounded border border-input bg-card hover:bg-muted text-foreground font-bold text-sm transition shadow-sm disabled:opacity-50"
            title="Reset/Seed default 10 career paths"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-primary ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Seeding...' : 'Seed Default Paths'}
          </button>
          <button 
            onClick={() => navigate('/admin/career-paths/new')}
            className="flex items-center px-5 py-2.5 rounded bg-primary text-primary-foreground font-black text-sm uppercase tracking-wide hover:opacity-90 transition shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" /> Add New Path
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Total Career Paths</p>
            <p className="text-3xl font-black text-foreground mt-1">{totalPaths}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Compass className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Active Departments</p>
            <p className="text-3xl font-black text-foreground mt-1">{totalDepts}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Total Defined Levels</p>
            <p className="text-3xl font-black text-foreground mt-1">{totalLevels}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Department Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by path title, department, or description..."
              className="w-full bg-background border border-input rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="bg-background border border-input rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Department Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {departments.map((dept) => {
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center bg-card rounded-xl border border-border">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground">Loading career paths...</p>
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-xl border border-border p-8 space-y-4">
          <Compass className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-foreground">No Career Paths Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              {searchQuery || selectedDept !== 'All' 
                ? 'No paths match your search or filter criteria.' 
                : 'No career paths available in database. Click below to seed default paths.'}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            {searchQuery || selectedDept !== 'All' ? (
              <button
                onClick={() => { setSearchQuery(''); setSelectedDept('All'); }}
                className="px-4 py-2 rounded bg-secondary text-foreground text-xs font-bold"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleSeedDefaultPaths}
                disabled={isSeeding}
                className="px-6 py-2.5 rounded bg-primary text-primary-foreground text-xs font-extrabold uppercase tracking-wide shadow"
              >
                Seed Default Career Paths
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map((path) => {
            const title = path.pathName || path.title || 'Untitled Path';
            const dept = path.department || 'Legacy';
            const badgeClass = DEPARTMENT_BADGES[dept] || DEPARTMENT_BADGES.Legacy;
            const status = path.status || 'draft';
            const statusBadgeClass = STATUS_BADGES[status] || STATUS_BADGES.draft;
            const levelCount = path.levels?.length || 0;
            const careerSlug = path.careerId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <div 
                key={path._id} 
                className="bg-card rounded-xl border border-border hover:border-primary/50 transition shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border uppercase tracking-wider ${badgeClass}`}>
                          {dept}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border uppercase tracking-wider ${statusBadgeClass}`}>
                          {status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mt-3 group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                    </div>
                    <span className="bg-muted text-muted-foreground border border-border px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                      {levelCount} {levelCount === 1 ? 'Level' : 'Levels'}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {path.description || 'No description provided.'}
                  </p>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/roadmap/${careerSlug}`)}
                    className="flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition"
                    title="View Public Roadmap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Roadmap
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/admin/career-paths/${path._id}`)}
                      className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded text-xs font-bold transition flex items-center gap-1"
                      title="Edit Path Builder"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteRequest(path)}
                      className="p-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-border rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-card-foreground">
              <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4">Path Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Levels</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaths.map((path) => {
                  const title = path.pathName || path.title || 'Untitled Path';
                  const dept = path.department || 'Legacy';
                  const badgeClass = DEPARTMENT_BADGES[dept] || DEPARTMENT_BADGES.Legacy;
                  const status = path.status || 'draft';
                  const statusBadgeClass = STATUS_BADGES[status] || STATUS_BADGES.draft;
                  const levelCount = path.levels?.length || 0;
                  const careerSlug = path.careerId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                  return (
                    <tr key={path._id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{title}</span>
                          <button
                            onClick={() => navigate(`/roadmap/${careerSlug}`)}
                            className="text-muted-foreground hover:text-primary transition"
                            title="View Public Roadmap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border uppercase ${badgeClass}`}>
                          {dept}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {levelCount} Levels
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border uppercase ${statusBadgeClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs text-muted-foreground" title={path.description}>
                        {path.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/career-paths/${path._id}`)}
                            className="p-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteRequest(path)}
                            className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-border rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Delete Career Path"
        description={`Are you sure you want to delete the career path "${itemToDelete?.pathName || itemToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};
