import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { CareerPath } from '@/modules/roadmap/types';
import { roadmapApi } from '@/modules/roadmap/api/roadmap.api';
import { Loader2 } from 'lucide-react';

const categoryIconPaths: Record<string, string[]> = {
  Engineering: [
    'M8 9l3 3-3 3',
    'M13 15h3',
    'M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  ],
  Infrastructure: [
    'M19 11H5',
    'M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2',
    'M5 11a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2'
  ],
  Data: [
    'M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4',
    'M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4v10c0 2.21-3.582 4-8 4s-8-1.79-8-4V7z',
    'M4 12c0 2.21 3.582 4 8 4s8-1.79 8-4'
  ],
  Design: [
    'M12 20h9',
    'M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z'
  ],
  Quality: [
    'M9 12l2 2 4-4',
    'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z'
  ],
  Product: [
    'M9 6h11',
    'M9 12h11',
    'M9 18h11',
    'M5 6h.01',
    'M5 12h.01',
    'M5 18h.01'
  ],
  AI: [
    'M12 3v3',
    'M12 18v3',
    'M3 12h3',
    'M18 12h3',
    'M8 8h8v8H8z',
    'M10 10h4v4h-4z'
  ]
};

const CareerIcon = ({ category }: { category?: string }) => {
  const paths = categoryIconPaths[category ?? ''] ?? categoryIconPaths.Engineering;

  return (
    <svg className="size-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      {paths.map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" d={path} />
      ))}
    </svg>
  );
};

export const HomePage = () => {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    roadmapApi.getPublicRoadmaps()
      .then((response) => setCareerPaths(response.data || []))
      .catch(() => setCareerPaths([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto py-10 space-y-6">
        <div className="inline-block px-3 py-1 text-xs font-mono font-bold border-2 border-foreground bg-primary/10 text-primary uppercase tracking-widest rounded-[2px]">
          Interactive Developer Learning
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-foreground">
          Step-by-Step paths to Developer Mastery
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-sans leading-relaxed">
          Explore structured career paths across engineering, data, design, product, quality, and AI with skills, resources, and portfolio-ready outcomes.
        </p>
        <div className="pt-4">
          <Link
            to="/roadmap"
            className="inline-block px-8 py-4 font-mono font-bold text-sm sm:text-base border-2 border-foreground bg-primary text-primary-foreground transition-all duration-150 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(250,250,250,1)] rounded-[2px]"
          >
            Explore Roadmaps
          </Link>
        </div>
      </section>

      {/* Grid of Topics / Recent Guides */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase font-mono">
            Popular Topics
          </h2>
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            {isLoading ? 'Loading...' : `${careerPaths.length} Career Paths Available`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-foreground bg-card rounded-[4px]">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-3 font-mono text-xs uppercase font-bold">Loading career paths...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {careerPaths.map((career) => (
                <Link
                  key={career.id}
                  to={`/roadmap/${career.id}`}
                  className="group block relative border-2 border-foreground bg-card text-card-foreground p-6 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(250,250,250,0.3)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 border-2 border-foreground rounded-[2px] bg-background">
                      <CareerIcon category={career.category} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-foreground rounded-[2px] bg-muted uppercase tracking-wider">
                        {career.category ?? 'Path'}
                      </span>
                      {career.difficulty && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-foreground rounded-[2px] bg-background uppercase tracking-wider">
                          {career.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {career.careerTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                    {career.description}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-dashed border-foreground/30 pt-3 font-mono text-[10px] uppercase">
                    <div>
                      <span className="block text-muted-foreground">Duration</span>
                      <strong>{career.duration ?? '10-12 weeks'}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Outcome</span>
                      <strong>{career.outcome ?? 'Portfolio proof'}</strong>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold text-primary group-hover:underline">
                    View Roadmap
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
            {careerPaths.length === 0 && (
              <div className="border-2 border-dashed border-foreground bg-card p-8 text-center rounded-[4px]">
                <p className="font-mono text-sm font-bold uppercase">No published career paths available</p>
                <p className="mt-2 text-sm text-muted-foreground">Please check back later or log in as admin to publish paths.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
