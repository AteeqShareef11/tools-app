import { Badge } from "./atoms";
import { StatCard } from "./Statcard";

;

/**
 * CandidateBanner
 * Hero block at the top of the profile tab. Shows:
 *   - avatar initials circle
 *   - name, role title, seniority badge
 *   - professional summary
 *   - 4 stat cards (experience, salary, location, best role)
 *
 * @param {{ data: object }} props
 */
export function CandidateBanner({ data }) {
    const initial = (data.name || "?").charAt(0).toUpperCase();

    return (
        <div
            className="fade-up rounded-2xl p-5 space-y-4"
            style={{
                background:
                    "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(56,189,248,0.05))",
                border: "1px solid rgba(99,102,241,0.15)",
            }}
        >
            {/* Top row: avatar + meta */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                    className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-cab font-black text-xl text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#38bdf8)" }}
                    aria-hidden="true"
                >
                    {initial}
                </div>

                {/* Name + summary */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <h2 className="font-cab font-black text-white text-xl leading-tight">
                                {data.name || "Your Profile"}
                            </h2>
                            <p className="text-indigo-300 text-sm font-medium mt-0.5">
                                {data.title}
                            </p>
                        </div>
                        {data.seniority && (
                            <Badge variant="purple">{data.seniority}</Badge>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        {data.summary}
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
                <StatCard icon="⚡" label="Experience" value={data.experience || "N/A"} color="indigo" />
                <StatCard icon="💰" label="Salary Range" value={data.salary || "Market rate"} color="green" />
                <StatCard icon="📍" label="Location" value={data.location || "Flexible"} color="sky" />
                <StatCard icon="🎯" label="Best Role" value={data.bestRoles?.[0] || "TBD"} color="amber" />
            </div>
        </div>
    );
}