import React from 'react';
import type { CareerPath } from '../types';
import { ResourceCard } from './ResourceCard';
import { NodeTest } from './NodeTest';

interface RoadmapTimelineProps {
  career: CareerPath;
  completedNodes: string[];
  expandedNode: string | null;
  onToggleNodeCompletion: (id: string, e: React.MouseEvent) => void;
  onToggleNodeExpand: (id: string | null) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  career,
  completedNodes,
  expandedNode,
  onToggleNodeCompletion,
  onToggleNodeExpand,
}) => {
  return (
    <section className="relative pl-8 sm:pl-16 space-y-10">
      {/* Vertical timeline connector line */}
      <div className="absolute left-[20px] sm:left-[36px] top-4 bottom-4 w-1 bg-foreground z-0" />

      {career.roadmapSteps.map((step, index) => {
        const isCompleted = completedNodes.includes(step.id);
        const isExpanded = expandedNode === step.id;

        return (
          <div key={step.id} className="relative group z-10">
            {/* Connector Dot */}
            <div
              onClick={(e) => onToggleNodeCompletion(step.id, e)}
              className={`absolute -left-[28px] sm:-left-[44px] top-1.5 size-6 sm:size-8 border-2 border-foreground rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 z-20 ${
                isCompleted
                  ? 'bg-primary text-primary-foreground scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
              title="Toggle Node Completion"
            >
              {isCompleted ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-mono font-bold text-foreground">{index + 1}</span>
              )}
            </div>

            {/* Step Card Box */}
            <div
              onClick={() => onToggleNodeExpand(isExpanded ? null : step.id)}
              className={`border-2 border-foreground bg-card text-card-foreground p-5 rounded-[4px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                isExpanded ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold uppercase font-mono tracking-tight flex items-center gap-2">
                    {step.title}
                    {isCompleted && (
                      <span className="text-[9px] font-mono font-bold bg-primary text-primary-foreground border border-foreground px-1.5 py-0.5 rounded-[2px]">
                        DONE
                      </span>
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-foreground shrink-0 border border-foreground p-1 rounded-[2px] bg-background">
                  <svg
                    className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Subtopics & Automated Resources */}
              {isExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-5 pt-4 border-t border-foreground space-y-5 cursor-default animate-fadeIn"
                >
                  {/* Subtopics Checklist chips */}
                  {step.subtopics && step.subtopics.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground block uppercase">
                        Concept Checklist:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {step.subtopics.map((topic) => (
                          <div
                            key={topic}
                            className="text-xs font-mono font-medium px-2.5 py-1 border border-foreground bg-muted text-foreground rounded-[2px]"
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automated Resource Cards Mapping */}
                  {step.externalResources && step.externalResources.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground block uppercase">
                        Reference Resources:
                      </span>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {step.externalResources.map((res) => (
                          <ResourceCard key={res.title} resource={res} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Section */}
                  <div className="pt-4 border-t border-dashed border-foreground">
                    {isCompleted ? (
                      <button
                        onClick={(e) => onToggleNodeCompletion(step.id, e)}
                        className="px-4 py-2 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-destructive text-destructive-foreground hover:bg-destructive/95"
                      >
                        Mark as Incomplete
                      </button>
                    ) : (
                      <NodeTest 
                        careerId={career.id} 
                        stepId={step.id} 
                        onCompleteSuccess={() => onToggleNodeCompletion(step.id, {} as React.MouseEvent)} 
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};
