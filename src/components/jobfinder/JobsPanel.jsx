import { JobCard } from "./JobCard";

/**
 * JobsPanel
 * Renders the full list of matched jobs or an empty state.
 *
 * @param {{ jobs: object[] }} props
 */
export function JobsPanel({ jobs }) {
  if (!jobs.length) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🔍</div>
        <p className="font-cab font-bold text-white">No strong matches found</p>
        <p className="text-sm text-slate-500">
          Review your skill gaps in the Profile tab to improve your chances.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {jobs.map((job, i) => (
        <JobCard key={i} job={job} index={i} />
      ))}
    </div>
  );
}
