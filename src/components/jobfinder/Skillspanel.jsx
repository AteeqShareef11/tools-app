import { Chip } from "./atoms";

/**
 * ChipGroup
 * Reusable labeled group of Chip tags.
 */
function ChipGroup({ title, items, type, delay = 0, accent }) {
    if (!items?.length) return null;

    return (
        <div
            className={`fade-up rounded-2xl p-4 space-y-2.5 ${accent ?? "glass"}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <p className="font-cab font-bold text-xs uppercase tracking-widest text-slate-400">
                {title}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                    <Chip key={i} label={item} type={type} />
                ))}
            </div>
        </div>
    );
}

/**
 * RecommendationList
 * Arrow-prefixed list of strategic recommendations.
 */
function RecommendationList({ items, delay = 0 }) {
    if (!items?.length) return null;

    return (
        <div
            className="fade-up glass rounded-2xl p-4 space-y-3"
            style={{ animationDelay: `${delay}s` }}
        >
            <p className="font-cab font-bold text-xs uppercase tracking-widest text-slate-400">
                Strategic Moves
            </p>
            {items.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 shrink-0 mt-0.5 text-xs">→</span>
                    <span className="text-sm text-slate-300 leading-relaxed">{rec}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * SkillsPanel
 * Full profile panel: primary skills, secondary skills, strengths,
 * skill gaps, and strategic recommendations.
 *
 * @param {{ data: object }} props
 */
export function SkillsPanel({ data }) {
    return (
        <div className="space-y-3">
            <ChipGroup
                title="Core Skills"
                items={data.primarySkills}
                type="primary"
                delay={0.05}
            />
            <ChipGroup
                title="Additional Skills"
                items={data.secondarySkills}
                type="secondary"
                delay={0.10}
            />
            <ChipGroup
                title="Career Strengths"
                items={data.strengths}
                type="strength"
                delay={0.15}
            />

            {/* Skill gaps get a red-tinted surface */}
            {data.skillGaps?.length > 0 && (
                <div
                    className="fade-up rounded-2xl p-4 space-y-2.5"
                    style={{
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        animationDelay: "0.20s",
                    }}
                >
                    <p className="font-cab font-bold text-xs uppercase tracking-widest text-red-400">
                        Skill Gaps
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {data.skillGaps.map((gap, i) => (
                            <Chip key={i} label={gap} type="gap" />
                        ))}
                    </div>
                </div>
            )}

            <RecommendationList items={data.recommendations} delay={0.25} />
        </div>
    );
}