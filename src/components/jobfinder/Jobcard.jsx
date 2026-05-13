import { useState } from "react";
import { Badge, Chip, ScoreBar } from "./atoms";

/**
 * JobCard
 * Individual job listing card. Shows summary by default; expands to reveal
 * match reasons and required skills.
 *
 * @param {{ job: object; index: number }} props
 */
export const JobCard = ({ job, index }) => {
    const [expanded, setExpanded] = useState(false);

    const delay = `${index * 0.06}s`;

    return (
        <article
            className="fade-up glass rounded-2xl overflow-hidden transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-indigo-500/25"
            style={{ animationDelay: delay }}
        >
            {/* ── Top section ─────────────────────────────────────── */}
            <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-cab font-bold text-white text-base leading-snug">
                            {job.title}
                        </h3>
                        <p className="text-indigo-400 text-sm font-medium mt-0.5">
                            {job.company}
                        </p>


                        {/* Badge row */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.location && (
                                <Badge variant="blue">📍 {job.location}</Badge>
                            )}
                            {job.workType && (
                                <Badge variant="gray">{job.workType}</Badge>
                            )}
                            {job.type && (
                                <Badge variant="amber">{job.type}</Badge>
                            )}
                        </div>
                    </div>

                    {/* Salary chip */}
                    {job.salary && (
                        <span
                            className="tag shrink-0 text-[11px] font-cab font-medium px-2.5 py-1 rounded-lg"
                            style={{
                                background: "rgba(52,211,153,0.1)",
                                color: "#6ee7b7",
                                border: "1px solid rgba(52,211,153,0.2)",
                            }}
                        >
                            {job.salary}
                        </span>
                    )}
                </div>

                {/* Match bar */}
                <ScoreBar score={job.matchScore ?? 75} />

                {/* Source + date */}
                {(job.posted || job.source) && (
                    <p className="text-xs text-slate-600 mt-2">
                        {job.posted && `🕒 ${job.posted}`}
                        {job.posted && job.source && " · "}
                        {job.source}
                    </p>
                )}
            </div>
            <p className="text-white-400 text-sm font-medium mt-0.5">
                {job.description}
            </p>

            {/* ── Expanded section ─────────────────────────────────── */}
            {expanded && (
                <div
                    className="px-5 pb-4 space-y-4 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                    {/* Why it matches */}
                    {job.whyMatches?.length > 0 && (
                        <div className="pt-3">
                            <p className="font-cab font-bold text-xs text-slate-500 uppercase tracking-widest mb-2">
                                Why it matches
                            </p>
                            <ul className="space-y-1.5">
                                {job.whyMatches.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-emerald-400 text-xs shrink-0 mt-0.5">
                                            ✓
                                        </span>
                                        <span className="text-xs text-slate-400 leading-relaxed">
                                            {reason}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Required skills */}
                    {job.skills?.length > 0 && (
                        <div>
                            <p className="font-cab font-bold text-xs text-slate-500 uppercase tracking-widest mb-2">
                                Required Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {job.skills.map((skill, i) => (
                                    <Chip key={i} label={skill} type="secondary" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Action row ───────────────────────────────────────── */}
            <div className="px-5 pb-4 flex items-center gap-2">
                {job.applyLink ? (
                    <a
                        href={job.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
              flex-1 text-center py-2.5 rounded-xl
              text-sm text-white font-cab font-bold
              transition-all duration-200
              hover:opacity-90 hover:-translate-y-px active:scale-[0.98]
            "
                        style={{
                            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                        }}
                    >
                        Apply Now →
                    </a>
                ) : (
                    <div
                        className="flex-1 py-2.5 text-sm text-center text-slate-600 rounded-xl"
                        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                        No link available
                    </div>
                )}

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="
            px-3 py-2.5 rounded-xl
            text-xs text-slate-400 font-cab font-bold
            bg-white/[0.03] border border-white/[0.08]
            hover:text-white hover:bg-white/[0.06]
            transition-colors duration-150
          "
                    aria-expanded={expanded}
                    aria-label={expanded ? "Show less" : "Show more"}
                >
                    {expanded ? "Less ↑" : "More ↓"}
                </button>
            </div>
        </article>
    );
}