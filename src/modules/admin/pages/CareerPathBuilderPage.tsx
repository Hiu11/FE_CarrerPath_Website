import { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, Plus, Trash2, ChevronDown, ChevronUp, X, Info, 
  AlertTriangle, CheckCircle2, Eye, BookOpen, Send, Archive, Bookmark
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { toast } from 'sonner';

const levelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  requiredSkills: z.array(z.string()),
  competencies: z.array(z.string()),
  learningResources: z.array(z.object({
    title: z.string().min(1, 'Resource title is required'),
    type: z.string().min(1, 'Resource type is required'),
    url: z.string().min(1, 'Resource URL is required')
  }))
});

const careerPathSchema = z.object({
  careerId: z.string().min(1, 'Career ID is required').regex(/^[a-z0-9-]+$/, 'Career ID must contain only lowercase letters, numbers, or hyphens'),
  pathName: z.string().min(1, 'Path Name is required'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['draft', 'published', 'archived']),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  estimatedDuration: z.string().min(1, 'Estimated Duration is required'),
  levels: z.array(levelSchema)
});

type CareerPathFormValues = z.infer<typeof careerPathSchema>;

const defaultValues: CareerPathFormValues = {
  careerId: '',
  pathName: '',
  department: 'Engineering',
  description: '',
  status: 'draft',
  difficulty: 'Intermediate',
  estimatedDuration: '',
  levels: [
    {
      name: 'JUNIOR DEVELOPER',
      requiredSkills: [],
      competencies: ['Demonstrates basic coding skills.'],
      learningResources: []
    }
  ]
};

interface Skill {
  _id: string;
  name: string;
  slug: string;
}

export const CareerPathBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLevelIndex, setActiveLevelIndex] = useState<number>(0);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 0: true });
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Quality Checklist states
  const [qualityCheck, setQualityCheck] = useState<any>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  // New competency inputs per level
  const [newCompetencies, setNewCompetencies] = useState<Record<number, string>>({});

  // New resource inputs per level
  const [newResourceTitles, setNewResourceTitles] = useState<Record<number, string>>({});
  const [newResourceUrls, setNewResourceUrls] = useState<Record<number, string>>({});
  const [newResourceTypes, setNewResourceTypes] = useState<Record<number, string>>({});

  const methods = useForm<CareerPathFormValues>({
    resolver: zodResolver(careerPathSchema),
    defaultValues
  });

  const { control, register, reset, setValue, formState: { errors } } = methods;
  
  const { fields: levels, append: appendLevel, remove: removeLevel } = useFieldArray({
    control,
    name: 'levels'
  });

  // Watch fields for realtime updates
  const watchedLevels = useWatch({ control, name: 'levels' }) || [];
  const watchedPathName = useWatch({ control, name: 'pathName' });
  const watchedStatus = useWatch({ control, name: 'status' }) || 'draft';
  const watchedDifficulty = useWatch({ control, name: 'difficulty' }) || 'Intermediate';
  const watchedDuration = useWatch({ control, name: 'estimatedDuration' });

  // Auto slugify pathName -> careerId when creating new
  useEffect(() => {
    if (watchedPathName && !isEditMode) {
      const slug = watchedPathName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('careerId', slug);
    }
  }, [watchedPathName, isEditMode, setValue]);

  // Fetch skills and path data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const skillsResponse = await adminApi.getSkills();
        setSkills(skillsResponse.data);

        if (isEditMode) {
          const pathResponse = await adminApi.getCareerPathById(id!);
          const data = pathResponse.data;

          const formattedLevels = (data.levels && data.levels.length > 0)
            ? data.levels.map((level: any) => ({
                name: level.name || '',
                requiredSkills: (level.requiredSkills || []).map((s: any) => typeof s === 'object' ? s._id : s),
                competencies: level.competencies || [],
                learningResources: level.learningResources || []
              }))
            : [
                {
                  name: 'LEVEL 1: CORE DEVELOPER',
                  requiredSkills: (data.skillIds || []).map((s: any) => typeof s === 'object' ? s._id : s),
                  competencies: ['Demonstrates base skill proficiency.'],
                  learningResources: []
                }
              ];

          reset({
            careerId: data.careerId || '',
            pathName: data.pathName || data.title || '',
            department: data.department || 'Engineering',
            description: data.description || '',
            status: data.status || 'draft',
            difficulty: data.difficulty || 'Intermediate',
            estimatedDuration: data.estimatedDuration || '',
            levels: formattedLevels
          });

          const expansions: Record<number, boolean> = {};
          formattedLevels.forEach((_: any, idx: number) => {
            expansions[idx] = true;
          });
          setExpandedLevels(expansions);

          // Run initial quality checklist
          const checkRes = await adminApi.qualityCheckCareerPath(id!);
          setQualityCheck(checkRes.data);
        }
      } catch (error) {
        toast.error('Failed to load builder data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, reset]);

  const runQualityCheck = async () => {
    if (!id) {
      toast.info('Please save this Career Path as a Draft first to perform database checks.');
      return;
    }
    setIsCheckingQuality(true);
    try {
      // Save current values first
      const values = methods.getValues();
      await adminApi.updateCareerPath(id, values);
      
      const checkRes = await adminApi.qualityCheckCareerPath(id);
      setQualityCheck(checkRes.data);
      toast.success('Quality checklist updated!');
    } catch {
      toast.error('Failed to run quality checklist');
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const toggleLevelExpand = (idx: number) => {
    setExpandedLevels(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddCompetency = (levelIdx: number) => {
    const text = newCompetencies[levelIdx]?.trim();
    if (!text) return;

    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[levelIdx];
    if (currentLevel) {
      const updated = [...(currentLevel.competencies || []), text];
      setValue(`levels.${levelIdx}.competencies`, updated);
      setNewCompetencies(prev => ({ ...prev, [levelIdx]: '' }));
    }
  };

  const handleRemoveCompetency = (levelIdx: number, compIdx: number) => {
    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[levelIdx];
    if (currentLevel) {
      const updated = (currentLevel.competencies || []).filter((_, idx) => idx !== compIdx);
      setValue(`levels.${levelIdx}.competencies`, updated);
    }
  };

  const handleAddResource = (levelIdx: number) => {
    const title = newResourceTitles[levelIdx]?.trim();
    const url = newResourceUrls[levelIdx]?.trim();
    const type = newResourceTypes[levelIdx]?.trim() || 'docs';

    if (!title || !url) {
      toast.error('Resource Title and URL are required');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') && url !== '#') {
      toast.error('URL must start with http:// or https://');
      return;
    }

    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[levelIdx];
    if (currentLevel) {
      const updated = [
        ...(currentLevel.learningResources || []),
        { title, url, type }
      ];
      setValue(`levels.${levelIdx}.learningResources`, updated);
      
      setNewResourceTitles(prev => ({ ...prev, [levelIdx]: '' }));
      setNewResourceUrls(prev => ({ ...prev, [levelIdx]: '' }));
      setNewResourceTypes(prev => ({ ...prev, [levelIdx]: '' }));
    }
  };

  const handleRemoveResource = (levelIdx: number, resIdx: number) => {
    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[levelIdx];
    if (currentLevel) {
      const updated = (currentLevel.learningResources || []).filter((_, idx) => idx !== resIdx);
      setValue(`levels.${levelIdx}.learningResources`, updated);
    }
  };

  const handleAddSkillToActiveLevel = (skillId: string) => {
    if (levels.length === 0) return;
    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[activeLevelIndex];
    if (currentLevel) {
      const currentSkills = currentLevel.requiredSkills || [];
      if (currentSkills.includes(skillId)) {
        toast.info('Skill is already added to this level');
        return;
      }
      setValue(`levels.${activeLevelIndex}.requiredSkills`, [...currentSkills, skillId]);
    }
  };

  const handleRemoveSkill = (levelIdx: number, skillId: string) => {
    const currentLevels = methods.getValues('levels') || [];
    const currentLevel = currentLevels[levelIdx];
    if (currentLevel) {
      const updated = (currentLevel.requiredSkills || []).filter(id => id !== skillId);
      setValue(`levels.${levelIdx}.requiredSkills`, updated);
    }
  };

  // Action Buttons
  const handleSaveDraft = async () => {
    const values = methods.getValues();
    values.status = 'draft';
    setIsLoading(true);
    try {
      if (isEditMode) {
        await adminApi.updateCareerPath(id!, values);
        toast.success('Career Path saved as Draft');
      } else {
        const res = await adminApi.createCareerPath(values);
        toast.success('Career Path created as Draft');
        navigate(`/admin/career-paths/${res.data._id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save career path');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!id) {
      toast.warning('Please save this path as Draft before publishing.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Run quality checklist first
      const checkRes = await adminApi.qualityCheckCareerPath(id);
      const checkResult = checkRes.data;
      setQualityCheck(checkResult);

      if (!checkResult.valid) {
        toast.error('Cannot publish. Please resolve all Quality Errors first.');
        return;
      }

      // 2. Call save under status published
      const values = methods.getValues();
      values.status = 'published';
      await adminApi.updateCareerPath(id, values);
      toast.success('Career Path published successfully! Synced to public Roadmap Timeline.');
      navigate('/admin/career-paths');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to publish');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const values = methods.getValues();
      values.status = 'draft';
      await adminApi.updateCareerPath(id, values);
      toast.success('Career Path reverted to Draft (Unpublished)');
      reset({ ...values, status: 'draft' });
    } catch (error: any) {
      toast.error('Failed to unpublish');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const values = methods.getValues();
      values.status = 'archived';
      await adminApi.updateCareerPath(id, values);
      toast.success('Career Path has been Archived');
      reset({ ...values, status: 'archived' });
    } catch (error: any) {
      toast.error('Failed to archive');
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillCategory = (skillName: string) => {
    const name = skillName.toLowerCase();
    if (['html', 'css', 'javascript', 'typescript', 'react', 'next.js', 'vue.js', 'redux', 'angular', 'tailwind'].some(k => name.includes(k))) {
      return 'Frontend';
    }
    if (['system design', 'architecture', 'docker', 'kubernetes', 'ci/cd', 'aws', 'cloud', 'scaling', 'microservices'].some(k => name.includes(k))) {
      return 'Architecture';
    }
    if (['mentorship', 'communication', 'soft skills', 'leadership', 'teamwork', 'management'].some(k => name.includes(k))) {
      return 'Soft Skills';
    }
    return 'Other Skills';
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const skillCategories = ['Frontend', 'Architecture', 'Soft Skills', 'Other Skills'];

  return (
    <div className="p-8 max-w-7xl mx-auto text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Admin &gt; Career Paths &gt; {isEditMode ? 'Edit Path' : 'New Path'}
            </p>
            {/* Status Badge */}
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border ${
              watchedStatus === 'published' 
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                : watchedStatus === 'archived'
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
            }`}>
              {watchedStatus}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase font-mono">
            {isEditMode ? 'EDIT CAREER PATH' : 'CREATE NEW CAREER PATH'}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            type="button" 
            onClick={() => navigate('/admin/career-paths')}
            className="px-4 py-2 border-2 border-foreground bg-muted font-bold font-mono text-xs uppercase rounded hover:bg-accent transition"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 border-2 border-foreground bg-secondary text-primary font-bold font-mono text-xs uppercase rounded hover:bg-secondary/80 transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>

          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="px-4 py-2 border-2 border-foreground bg-background font-bold font-mono text-xs uppercase rounded hover:bg-muted transition flex items-center gap-1.5"
          >
            <Bookmark className="w-4 h-4" /> Save Draft
          </button>

          {isEditMode && (
            <>
              {watchedStatus === 'published' ? (
                <button 
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isLoading}
                  className="px-4 py-2 border-2 border-foreground bg-amber-500 text-black font-bold font-mono text-xs uppercase rounded hover:opacity-90 transition flex items-center gap-1.5"
                >
                  Unpublish
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="px-4 py-2 border-2 border-foreground bg-primary text-primary-foreground font-bold font-mono text-xs uppercase rounded hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Publish Path
                </button>
              )}

              {watchedStatus !== 'archived' && (
                <button 
                  type="button"
                  onClick={handleArchive}
                  disabled={isLoading}
                  className="px-4 py-2 border-2 border-foreground bg-rose-500 text-white font-bold font-mono text-xs uppercase rounded hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <FormProvider {...methods}>
        <form className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8 animate-fadeIn">
            
            {/* General Information */}
            <div className="bg-card rounded-lg border-2 border-foreground p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-5">
              <div className="flex items-center gap-2 border-b-2 border-dashed border-border pb-3">
                <span className="bg-primary text-primary-foreground px-2 py-0.5 border border-foreground rounded text-[10px] font-mono font-bold">STEP 1</span>
                <h2 className="text-foreground font-extrabold uppercase font-mono text-sm">General Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono">Path Name</label>
                  <input 
                    {...register('pathName')}
                    className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary font-bold"
                    placeholder="e.g. Frontend Developer"
                  />
                  {errors.pathName && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.pathName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono font-mono">Career ID (URL Path Slug)</label>
                  <input 
                    {...register('careerId')}
                    disabled={isEditMode}
                    className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary font-mono disabled:opacity-60"
                    placeholder="e.g. frontend-developer"
                  />
                  {errors.careerId && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.careerId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono">Department</label>
                  <select 
                    {...register('department')}
                    className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary appearance-none font-bold"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Data">Data</option>
                    <option value="Quality">Quality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono">Difficulty</label>
                  <select 
                    {...register('difficulty')}
                    className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary appearance-none font-bold"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono">Estimated Duration</label>
                  <input 
                    {...register('estimatedDuration')}
                    className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary font-bold"
                    placeholder="e.g. 10-12 weeks"
                  />
                  {errors.estimatedDuration && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.estimatedDuration.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-muted-foreground uppercase mb-2 font-mono">Description</label>
                <textarea 
                  {...register('description')}
                  className="w-full bg-background border-2 border-foreground rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary min-h-[90px] font-sans"
                  placeholder="Provide a high-level overview of this career trajectory..."
                />
                {errors.description && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.description.message}</p>}
              </div>
            </div>

            {/* Path Roadmap Accordion */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-foreground uppercase font-mono">Path Roadmap Levels</h2>
                <button 
                  type="button"
                  onClick={() => {
                    appendLevel({ name: 'NEW LEVEL', requiredSkills: [], competencies: [], learningResources: [] });
                    const newIndex = levels.length;
                    setExpandedLevels(prev => ({ ...prev, [newIndex]: true }));
                    setActiveLevelIndex(newIndex);
                  }}
                  className="flex items-center text-xs font-extrabold px-3 py-1.5 border-2 border-foreground bg-primary text-primary-foreground rounded hover:opacity-90 transition font-mono uppercase"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Level
                </button>
              </div>
              
              <div className="space-y-4">
                {levels.map((level, index) => {
                  const isExpanded = expandedLevels[index] ?? false;
                  const isActive = activeLevelIndex === index;

                  return (
                    <div key={level.id} className="flex gap-4">
                      {/* Level Index Circle */}
                      <button
                        type="button"
                        onClick={() => setActiveLevelIndex(index)}
                        className={`w-10 h-10 shrink-0 font-mono font-extrabold flex items-center justify-center rounded border-2 transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-muted text-muted-foreground border-foreground hover:bg-accent'
                        }`}
                        title="Click to select this level for assigning skills"
                      >
                        {index + 1}
                      </button>

                      {/* Accordion Block */}
                      <div className={`flex-1 bg-card rounded border-2 transition-all ${
                        isActive ? 'border-primary' : 'border-foreground'
                      } overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                        
                        <div 
                          onClick={() => toggleLevelExpand(index)}
                          className="p-4 flex justify-between items-center cursor-pointer bg-card hover:bg-muted/40 transition border-b border-foreground"
                        >
                          <div className="flex items-center gap-4 w-full">
                            <input 
                              {...register(`levels.${index}.name`)}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono font-extrabold text-base text-foreground bg-transparent outline-none border-b border-transparent focus:border-primary w-2/3 uppercase"
                            />
                            {isActive && (
                              <span className="text-[9px] bg-primary/20 text-primary font-extrabold px-1.5 py-0.5 rounded border border-primary/30 uppercase tracking-wider font-mono">
                                Active target
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLevel(index);
                                if (activeLevelIndex === index) {
                                  setActiveLevelIndex(Math.max(0, index - 1));
                                }
                              }}
                              className="text-muted-foreground hover:text-rose-500 p-1 transition"
                              title="Delete Level"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-6 space-y-6">
                            
                            {/* Required Skills */}
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase mb-3 font-mono">Required Skills</p>
                              <div 
                                onClick={() => setActiveLevelIndex(index)}
                                className={`flex flex-wrap gap-2 p-3 bg-background border-2 rounded min-h-[60px] cursor-pointer transition ${
                                  isActive ? 'border-primary' : 'border-border'
                                }`}
                              >
                                {((watchedLevels[index]?.requiredSkills || []) as string[]).map((skillId) => {
                                  const skillObj = skills.find(s => s._id === skillId);
                                  return (
                                    <span 
                                      key={skillId} 
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono font-bold text-primary"
                                    >
                                      {skillObj?.name || 'Loading skill...'}
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSkill(index, skillId);
                                        }}
                                        className="hover:text-rose-500 transition"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                                {((watchedLevels[index]?.requiredSkills || []) as string[]).length === 0 && (
                                  <span className="text-xs text-muted-foreground font-mono self-center">
                                    Click any skills on the right library panel to assign
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Competencies */}
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase mb-3 font-mono">Competencies</p>
                              <div className="space-y-3">
                                {((watchedLevels[index]?.competencies || []) as string[]).map((competency, compIdx) => (
                                  <div key={compIdx} className="flex items-center justify-between p-3 bg-background border border-border rounded">
                                    <span className="text-xs font-semibold text-foreground">{competency}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveCompetency(index, compIdx)}
                                      className="text-muted-foreground hover:text-rose-500 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                                <div className="flex gap-2">
                                  <input 
                                    value={newCompetencies[index] || ''}
                                    onChange={(e) => setNewCompetencies(prev => ({ ...prev, [index]: e.target.value }))}
                                    className="flex-1 bg-background border-2 border-foreground rounded p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                                    placeholder="Add competency expectation..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCompetency(index);
                                      }
                                    }}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => handleAddCompetency(index)}
                                    className="px-3 bg-secondary text-primary border-2 border-foreground hover:bg-secondary/80 rounded text-xs font-bold transition font-mono uppercase"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Resources */}
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase mb-3 font-mono">Learning Resources</p>
                              <div className="space-y-3">
                                {((watchedLevels[index]?.learningResources || []) as any[]).map((resource, resIdx) => (
                                  <div key={resIdx} className="flex items-center justify-between p-3 bg-background border border-border rounded">
                                    <div>
                                      <span className="text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded mr-2 tracking-wide font-mono uppercase">
                                        {resource.type}
                                      </span>
                                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-foreground hover:text-primary underline">
                                        {resource.title}
                                      </a>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveResource(index, resIdx)}
                                      className="text-muted-foreground hover:text-rose-500 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                                <div className="bg-background border-2 border-foreground rounded p-4 space-y-3">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Attach Learning Link</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input 
                                      value={newResourceTitles[index] || ''}
                                      onChange={(e) => setNewResourceTitles(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-transparent border-b-2 border-foreground p-2 text-xs text-foreground focus:outline-none focus:border-primary font-bold"
                                      placeholder="Title (e.g. React Official Docs)"
                                    />
                                    <input 
                                      value={newResourceUrls[index] || ''}
                                      onChange={(e) => setNewResourceUrls(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-transparent border-b-2 border-foreground p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                                      placeholder="URL (e.g. https://react.dev)"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center pt-2">
                                    <select 
                                      value={newResourceTypes[index] || 'docs'}
                                      onChange={(e) => setNewResourceTypes(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-card border-2 border-foreground rounded p-1.5 text-xs font-extrabold text-foreground focus:outline-none font-mono"
                                    >
                                      <option value="docs">DOCUMENTATION</option>
                                      <option value="video">VIDEO TUTORIAL</option>
                                      <option value="course">ONLINE COURSE</option>
                                      <option value="project">PRACTICAL PROJECT</option>
                                    </select>
                                    <button 
                                      type="button"
                                      onClick={() => handleAddResource(index)}
                                      className="flex items-center text-xs font-extrabold text-primary hover:text-primary/80 font-mono uppercase"
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" /> Attach Link
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {levels.length === 0 && (
                  <div className="p-8 text-center bg-card rounded border-2 border-foreground border-dashed text-muted-foreground font-mono font-bold text-xs uppercase">
                    No levels configured yet. Click "Add Level" to start.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Library & Checklist */}
          <div className="space-y-8">
            
            {/* Quality Checklist Panel */}
            <div className="bg-card rounded-lg border-2 border-foreground p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-base font-extrabold text-foreground uppercase font-mono">Quality Checklist</h2>
                <button
                  type="button"
                  onClick={runQualityCheck}
                  disabled={isCheckingQuality || !isEditMode}
                  className="px-2.5 py-1 border border-foreground bg-primary text-primary-foreground text-[10px] font-extrabold rounded font-mono uppercase hover:opacity-90 disabled:opacity-50"
                  title={!isEditMode ? 'Save Career Path as Draft first to check quality' : 'Run Check'}
                >
                  {isCheckingQuality ? 'Checking...' : 'Check Quality'}
                </button>
              </div>

              {!isEditMode ? (
                <div className="p-4 border border-dashed border-foreground/30 bg-muted/30 rounded text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">
                    Save as Draft first to enable database checks (Quiz & Resource Coverage).
                  </p>
                </div>
              ) : qualityCheck ? (
                <div className="space-y-4 text-xs font-mono">
                  {/* Validation status badge */}
                  <div className={`p-3 border-2 rounded flex items-center gap-2 ${
                    qualityCheck.valid 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {qualityCheck.valid ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="font-extrabold uppercase">
                      {qualityCheck.valid ? 'Ready to Publish' : 'Needs Correction'}
                    </span>
                  </div>

                  {/* Errors */}
                  {qualityCheck.errors?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-extrabold text-rose-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Errors ({qualityCheck.errors.length})
                      </p>
                      <ul className="list-disc pl-4 text-[10px] text-rose-500/90 space-y-1">
                        {qualityCheck.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {qualityCheck.warnings?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <p className="font-extrabold text-amber-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Warnings ({qualityCheck.warnings.length})
                      </p>
                      <ul className="list-disc pl-4 text-[10px] text-amber-500/90 space-y-1">
                        {qualityCheck.warnings.map((warn: string, i: number) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Indicators stats */}
                  {qualityCheck.indicators && (
                    <div className="space-y-2 pt-3 border-t border-border text-[10px] text-muted-foreground uppercase font-bold">
                      <div className="flex justify-between">
                        <span>Quiz Coverage:</span>
                        <span>{qualityCheck.indicators.quizCoverage.hasQuizCount} / {qualityCheck.indicators.quizCoverage.total} Skills</span>
                      </div>
                      <div className="w-full bg-muted border border-foreground h-2 rounded overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(qualityCheck.indicators.quizCoverage.hasQuizCount / Math.max(1, qualityCheck.indicators.quizCoverage.total)) * 100}%` }}
                        />
                      </div>

                      <div className="flex justify-between mt-2">
                        <span>Resource Coverage:</span>
                        <span>{qualityCheck.indicators.resourceCoverage.hasResourceCount} / {qualityCheck.indicators.resourceCoverage.total} Skills</span>
                      </div>
                      <div className="w-full bg-muted border border-foreground h-2 rounded overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(qualityCheck.indicators.resourceCoverage.hasResourceCount / Math.max(1, qualityCheck.indicators.resourceCoverage.total)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-foreground/30 bg-muted/30 rounded text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">
                    Click 'Check Quality' to inspect validation errors and metadata coverage.
                  </p>
                </div>
              )}
            </div>

            {/* Skill Library */}
            <div className="bg-primary rounded p-1 shadow-xl shadow-primary/10">
              <div className="bg-card rounded p-6 h-full border border-border">
                <h2 className="text-lg font-extrabold text-foreground uppercase font-mono mb-1">Skill Library</h2>
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-4 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                  Select a Level index then click skill below to assign
                </p>
                
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full bg-background border-2 border-foreground rounded py-2.5 pl-10 pr-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
                  {skillCategories.map((category) => {
                    const categorySkills = filteredSkills.filter(s => getSkillCategory(s.name) === category);
                    if (categorySkills.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-xs font-extrabold text-primary uppercase font-mono tracking-wider mb-2">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill) => (
                            <button
                              key={skill._id}
                              type="button"
                              onClick={() => handleAddSkillToActiveLevel(skill._id)}
                              className="px-2.5 py-1.5 bg-background border border-foreground hover:border-primary hover:bg-muted text-xs font-mono font-bold text-foreground rounded transition cursor-pointer select-none"
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {filteredSkills.length === 0 && (
                    <p className="text-xs text-muted-foreground font-mono text-center py-4 uppercase font-bold">No matching skills found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Path Overview */}
            <div className="bg-card rounded border-2 border-foreground p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
              <h2 className="text-base font-extrabold text-foreground uppercase font-mono mb-2">Path Statistics</h2>
              <div className="space-y-3 font-mono text-xs uppercase font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Levels:</span>
                  <span className="text-primary font-extrabold">{watchedLevels.length} Levels</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="text-primary font-extrabold">{watchedDifficulty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Est. Duration:</span>
                  <span className="text-primary font-extrabold">{watchedDuration || 'Not set'}</span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </FormProvider>

      {/* Preview Mode Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-background text-foreground border-2 border-foreground max-w-4xl w-full max-h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-zoomIn">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-foreground bg-card flex justify-between items-center">
              <div>
                <span className="font-mono text-[10px] font-extrabold text-primary uppercase tracking-widest block mb-1">
                  Preview Mode
                </span>
                <h3 className="text-2xl font-extrabold font-mono uppercase tracking-tight">
                  {watchedPathName || 'Unnamed Career Path'}
                </h3>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 border-2 border-foreground bg-muted hover:bg-rose-500 hover:text-white rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Learner Simulator UI) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Path metadata */}
              <div className="grid grid-cols-3 gap-4 p-4 border border-foreground bg-card rounded font-mono text-xs uppercase font-bold">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[9px]">Department</span>
                  <span>{methods.getValues('department') || 'Engineering'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[9px]">Difficulty</span>
                  <span>{watchedDifficulty}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[9px]">Est. Duration</span>
                  <span>{watchedDuration || 'Unspecified'}</span>
                </div>
              </div>

              {/* Path description */}
              <div className="space-y-2">
                <h4 className="font-mono text-xs font-extrabold uppercase text-primary">Overview</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {methods.getValues('description') || 'No description provided.'}
                </p>
              </div>

              {/* Timeline stages simulation */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-mono text-xs font-extrabold uppercase text-primary mb-4">Roadmap Journey ({watchedLevels.length} Stages)</h4>
                
                <div className="relative pl-6 border-l-2 border-foreground space-y-6">
                  {watchedLevels.map((lvl: any, index: number) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-foreground bg-primary flex items-center justify-center font-mono text-[8px] font-extrabold text-primary-foreground shadow">
                        {index + 1}
                      </span>
                      
                      <div className="border border-foreground bg-card p-5 rounded space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <h5 className="font-mono font-extrabold text-sm uppercase text-foreground">{lvl.name || 'Unnamed Stage'}</h5>
                        
                        {/* Skills chips */}
                        {lvl.requiredSkills?.length > 0 && (
                          <div className="space-y-1">
                            <span className="block text-[9px] font-mono text-muted-foreground uppercase font-bold">Target Core Skills:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {lvl.requiredSkills.map((skId: string) => {
                                const skObj = skills.find(s => s._id === skId);
                                return (
                                  <span key={skId} className="text-[10px] font-mono font-bold px-2 py-0.5 border border-foreground bg-background rounded uppercase">
                                    {skObj?.name || 'Skill'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Competencies */}
                        {lvl.competencies?.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="block text-[9px] font-mono text-muted-foreground uppercase font-bold">Standard Competencies:</span>
                            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 font-sans">
                              {lvl.competencies.map((comp: string, i: number) => (
                                <li key={i}>{comp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Learning resources */}
                        {lvl.learningResources?.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <span className="block text-[9px] font-mono text-muted-foreground uppercase font-bold">Curated Resources:</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {lvl.learningResources.map((res: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-border bg-background rounded text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="font-mono text-[9px] font-extrabold uppercase bg-primary/10 text-primary px-1 rounded shrink-0">
                                      {res.type}
                                    </span>
                                    <span className="font-bold truncate text-foreground/80">{res.title}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-primary font-bold shrink-0 ml-2">Link &gt;</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {watchedLevels.length === 0 && (
                    <p className="text-xs text-muted-foreground font-mono uppercase font-bold py-2">No stages mapped to this timeline yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-foreground bg-muted flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-2 border-2 border-foreground bg-primary text-primary-foreground font-bold font-mono text-xs uppercase rounded hover:opacity-90 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
