import { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Trash2, ChevronDown, ChevronUp, Star, X, Info } from 'lucide-react';
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
    url: z.string().url('Invalid URL')
  }))
});

const careerPathSchema = z.object({
  pathName: z.string().min(1, 'Path Name is required'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().min(1, 'Description is required'),
  levels: z.array(levelSchema)
});

type CareerPathFormValues = z.infer<typeof careerPathSchema>;

const defaultValues: CareerPathFormValues = {
  pathName: '',
  department: 'Engineering',
  description: '',
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

  const { control, handleSubmit, register, reset, setValue } = methods;
  
  const { fields: levels, append: appendLevel, remove: removeLevel } = useFieldArray({
    control,
    name: 'levels'
  });

  // Watch fields for Path Overview calculations
  const watchedLevels = useWatch({
    control,
    name: 'levels'
  }) || [];

  // Fetch skills and path data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all skills
        const skillsResponse = await adminApi.getSkills();
        setSkills(skillsResponse.data);

        // Fetch career path if editing
        if (isEditMode) {
          const pathResponse = await adminApi.getCareerPathById(id!);
          const data = pathResponse.data;

          // Format levels for react-hook-form: requiredSkills must be ID strings
          const formattedLevels = (data.levels || []).map((level: any) => ({
            name: level.name || '',
            requiredSkills: (level.requiredSkills || []).map((s: any) => typeof s === 'object' ? s._id : s),
            competencies: level.competencies || [],
            learningResources: level.learningResources || []
          }));

          reset({
            pathName: data.pathName || data.title || '',
            department: data.department || 'Engineering',
            description: data.description || '',
            levels: formattedLevels
          });

          // Expand all loaded levels
          const expansions: Record<number, boolean> = {};
          formattedLevels.forEach((_: any, idx: number) => {
            expansions[idx] = true;
          });
          setExpandedLevels(expansions);
        }
      } catch (error) {
        toast.error('Failed to load builder data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, reset]);

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
    const type = newResourceTypes[levelIdx]?.trim() || 'EXTERNAL DOC';

    if (!title || !url) {
      toast.error('Resource Title and URL are required');
      return;
    }

    // Basic URL validation
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
      
      // Clear inputs
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

  // Add skill to currently active level
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

  const onSubmit = async (data: CareerPathFormValues) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await adminApi.updateCareerPath(id!, data);
        toast.success('Career Path updated successfully');
      } else {
        await adminApi.createCareerPath(data);
        toast.success('Career Path created successfully');
      }
      navigate('/admin/career-paths');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save career path');
    } finally {
      setIsLoading(false);
    }
  };

  // Categorize skills based on custom mapping (fallback to 'Other' if not matched)
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

  // Path Overview Dynamic Stats
  const totalLevels = watchedLevels.length;
  
  // Estimate duration: 1 year per level as baseline
  const estDuration = totalLevels > 0 ? `${totalLevels * 1} Years` : '0 Years';
  
  // Difficulty mapping: 1-2 levels = 1 star, 3 levels = 2 stars, 4 = 3 stars, 5+ = 4/5 stars
  const difficultyRating = Math.min(5, Math.max(1, Math.ceil(totalLevels * 0.8)));

  if (isLoading && levels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0b] text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-semibold">Loading Career Path Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
            Admin &gt; Career Paths &gt; {isEditMode ? 'Edit Path' : 'New Path'}
          </p>
          <h1 className="text-3xl font-extrabold text-white">
            {isEditMode ? 'EDIT CAREER PATH' : 'CREATE NEW CAREER PATH'}
          </h1>
        </div>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/admin/career-paths')}
            className="px-6 py-2 rounded border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            className="px-6 py-2 rounded bg-amber-400 text-black font-extrabold hover:bg-amber-500 transition shadow-md"
          >
            {isEditMode ? 'Save Changes' : 'Save Path'}
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            
            {/* General Information */}
            <div className="bg-[#0f0f11] rounded-xl border border-slate-800 p-6">
              <h2 className="text-amber-400 font-bold uppercase tracking-wide mb-6">General Information</h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Path Name</label>
                  <input 
                    {...register('pathName')}
                    className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Department</label>
                  <select 
                    {...register('department')}
                    className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 appearance-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                <textarea 
                  {...register('description')}
                  className="w-full bg-[#0a0a0b] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-amber-400 min-h-[100px]"
                  placeholder="Provide a high-level overview of this career trajectory..."
                />
              </div>
            </div>

            {/* Path Roadmap */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white uppercase">Path Roadmap</h2>
                <button 
                  type="button"
                  onClick={() => {
                    appendLevel({ name: 'NEW LEVEL', requiredSkills: [], competencies: [], learningResources: [] });
                    const newIndex = levels.length;
                    setExpandedLevels(prev => ({ ...prev, [newIndex]: true }));
                    setActiveLevelIndex(newIndex);
                  }}
                  className="flex items-center text-amber-400 font-bold text-sm hover:text-amber-300"
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
                      {/* Level Index Indicator */}
                      <button
                        type="button"
                        onClick={() => setActiveLevelIndex(index)}
                        className={`w-10 h-10 shrink-0 font-extrabold flex items-center justify-center rounded transition-colors ${
                          isActive 
                            ? 'bg-amber-400 text-black border-2 border-amber-400 shadow-lg shadow-amber-400/20' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                        title="Click to select this level for skills assignment"
                      >
                        {index + 1}
                      </button>

                      {/* Accordion Block */}
                      <div className={`flex-1 bg-[#1a1a1c] rounded-xl border transition-all ${
                        isActive ? 'border-amber-400/50 shadow-md' : 'border-slate-800'
                      } overflow-hidden`}>
                        <div 
                          onClick={() => toggleLevelExpand(index)}
                          className="p-4 flex justify-between items-center cursor-pointer bg-[#0f0f11] hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center gap-4 w-full">
                            <input 
                              {...register(`levels.${index}.name`)}
                              onClick={(e) => e.stopPropagation()} // Stop accordion toggling when editing title
                              className="font-bold text-lg text-white bg-transparent outline-none border-b border-transparent focus:border-amber-400 w-1/2"
                            />
                            {isActive && (
                              <span className="text-[10px] bg-amber-400/20 text-amber-400 font-extrabold px-2 py-0.5 rounded border border-amber-400/30 uppercase">
                                Active Target
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
                              className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                              title="Delete Level"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-amber-400" />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-6 border-t border-slate-800/80 space-y-6">
                            
                            {/* Required Skills */}
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Required Skills</p>
                              <div 
                                onClick={() => setActiveLevelIndex(index)}
                                className={`flex flex-wrap gap-2 p-3 bg-[#0a0a0b] border rounded min-h-[60px] cursor-pointer transition ${
                                  isActive ? 'border-amber-400/30' : 'border-slate-800'
                                }`}
                              >
                                {((watchedLevels[index]?.requiredSkills || []) as string[]).map((skillId) => {
                                  const skillObj = skills.find(s => s._id === skillId);
                                  return (
                                    <span 
                                      key={skillId} 
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded text-sm font-semibold text-amber-400"
                                    >
                                      {skillObj?.name || 'Loading skill...'}
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSkill(index, skillId);
                                        }}
                                        className="hover:text-amber-200 transition"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                                {((watchedLevels[index]?.requiredSkills || []) as string[]).length === 0 && (
                                  <span className="text-xs text-slate-500 font-medium self-center">
                                    Click any skills on the library panel to add
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Competency Standards */}
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Competency Standards</p>
                              <div className="space-y-3">
                                {((watchedLevels[index]?.competencies || []) as string[]).map((competency, compIdx) => (
                                  <div key={compIdx} className="flex items-center justify-between p-3 bg-[#0a0a0b] border border-slate-800 rounded">
                                    <span className="text-sm font-semibold text-slate-200">{competency}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveCompetency(index, compIdx)}
                                      className="text-slate-500 hover:text-red-400 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                                <div className="flex gap-2">
                                  <input 
                                    value={newCompetencies[index] || ''}
                                    onChange={(e) => setNewCompetencies(prev => ({ ...prev, [index]: e.target.value }))}
                                    className="flex-1 bg-[#0a0a0b] border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400"
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
                                    className="px-4 bg-slate-800 text-amber-400 font-bold border border-slate-700 hover:bg-slate-700 rounded text-sm transition"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Learning Resources */}
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Learning Resources</p>
                              <div className="space-y-3">
                                {((watchedLevels[index]?.learningResources || []) as any[]).map((resource, resIdx) => (
                                  <div key={resIdx} className="flex items-center justify-between p-3 bg-[#0a0a0b] border border-slate-800 rounded">
                                    <div>
                                      <span className="text-xs font-extrabold text-amber-400 uppercase mr-2 tracking-wide">
                                        {resource.type}
                                      </span>
                                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-200 hover:text-white underline">
                                        {resource.title}
                                      </a>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveResource(index, resIdx)}
                                      className="text-slate-500 hover:text-red-400 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                                {/* Add Resource fields */}
                                <div className="bg-[#0a0a0b] border border-slate-800 rounded p-4 space-y-3">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attach Resource</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input 
                                      value={newResourceTitles[index] || ''}
                                      onChange={(e) => setNewResourceTitles(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-transparent border-b border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-amber-400"
                                      placeholder="Resource Title (e.g. React Docs)"
                                    />
                                    <input 
                                      value={newResourceUrls[index] || ''}
                                      onChange={(e) => setNewResourceUrls(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-transparent border-b border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-amber-400"
                                      placeholder="URL (e.g. https://react.dev)"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center pt-2">
                                    <select 
                                      value={newResourceTypes[index] || 'EXTERNAL DOC'}
                                      onChange={(e) => setNewResourceTypes(prev => ({ ...prev, [index]: e.target.value }))}
                                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs font-bold text-slate-300 focus:outline-none"
                                    >
                                      <option value="INTERNAL COURSE">INTERNAL COURSE</option>
                                      <option value="EXTERNAL DOC">EXTERNAL DOC</option>
                                      <option value="VIDEO TUTORIAL">VIDEO TUTORIAL</option>
                                    </select>
                                    <button 
                                      type="button"
                                      onClick={() => handleAddResource(index)}
                                      className="flex items-center text-xs font-bold text-amber-400 hover:text-amber-300"
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
                  <div className="p-8 text-center bg-[#0f0f11] rounded-xl border border-slate-800 border-dashed text-slate-500 font-semibold">
                    No levels configured yet. Click "Add Level" to start outlining your path.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Skill Library & Path Overview */}
          <div className="space-y-8">
            
            {/* Skill Library */}
            <div className="bg-amber-400 rounded-xl p-1 shadow-xl">
              <div className="bg-[#0f0f11] rounded-lg p-6 h-full border border-slate-950">
                <h2 className="text-xl font-bold text-white uppercase mb-1">Skill Library</h2>
                <p className="text-xs text-slate-400 font-semibold mb-6 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  Select a Level index (left) then click skill below to assign
                </p>
                
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search global skills..."
                    className="w-full bg-[#0a0a0b] border border-slate-800 rounded py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1">
                  {skillCategories.map((category) => {
                    const categorySkills = filteredSkills.filter(s => getSkillCategory(s.name) === category);
                    if (categorySkills.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill) => (
                            <button
                              key={skill._id}
                              type="button"
                              onClick={() => handleAddSkillToActiveLevel(skill._id)}
                              className="px-3 py-1.5 bg-[#1a1a1c] border border-slate-800/80 hover:border-amber-400/50 hover:bg-slate-800 text-sm font-semibold text-slate-200 rounded transition cursor-pointer select-none"
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {filteredSkills.length === 0 && (
                    <p className="text-xs text-slate-600 font-semibold text-center py-4">No matching skills found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Path Overview */}
            <div className="bg-[#0f0f11] rounded-xl border border-slate-800 p-6 shadow-lg">
              <h2 className="text-lg font-bold text-white uppercase mb-6">Path Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm uppercase">Total Levels:</span>
                  <span className="text-amber-400 font-extrabold">{totalLevels} Levels</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm uppercase">Est. Duration:</span>
                  <span className="text-amber-400 font-extrabold">{estDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm uppercase">Difficulty:</span>
                  <div className="flex text-amber-400 gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star 
                        key={idx} 
                        className={`w-4 h-4 ${idx < difficultyRating ? 'fill-current' : 'text-slate-700'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </FormProvider>
    </div>
  );
};
