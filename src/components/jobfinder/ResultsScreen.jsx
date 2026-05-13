import { useState } from "react";
import { CandidateBanner } from "./CandidateBanner";
import { SkillsPanel } from "./SkillsPanel";
import { JobsPanel } from "./JobsPanel";
import { TabBar } from "./TabBar";

/**
 * ResultsNavbar
 * Sticky top bar shown on the results screen.
 */
function ResultsNavbar({ fileName, onReset }) {
  return (
    <nav className="sticky top-0 z-20 glass-navbar px-5 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="font-cab font-black text-lg grad-text">
          AI Job Hunter
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-cab font-medium
                     bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
        >
          ✓ Done
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {fileName && (
          <span className="text-xs text-slate-600 hidden sm:block truncate max-w-[140px]">
            📄 {fileName}
          </span>
        )}
        <button
          onClick={onReset}
          className="
            px-3 py-1.5 rounded-lg text-xs font-cab font-bold text-slate-400
            bg-white/[0.03] border border-white/[0.08]
            hover:text-white hover:bg-white/[0.06]
            transition-colors duration-150
          "
        >
          ↺ New Resume
        </button>
      </div>
    </nav>
  );
}

/**
 * ResultsScreen
 * Composes the full results page: navbar → tab bar → profile or jobs panel.
 *
 * @param {{ candidate: object; jobs: object[]; fileName: string | null; onReset: () => void }} props
 */
export function ResultsScreen({ candidate, jobs, fileName, onReset }) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen">
      <ResultsNavbar fileName={fileName} onReset={onReset} />

      <main className="max-w-2xl mx-auto p-5 space-y-4">
        <TabBar
          active={activeTab}
          setActive={setActiveTab}
          jobCount={jobs.length}
        />

        {activeTab === "profile" && (
          <div className="space-y-4">
            <CandidateBanner data={candidate} />
            <SkillsPanel data={candidate} />
          </div>
        )}

        {activeTab === "jobs" && <JobsPanel jobs={jobs} />}
      </main>
    </div>
  );
}
