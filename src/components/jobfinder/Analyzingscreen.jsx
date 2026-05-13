import { ANALYSIS_STEPS } from "./constants";

/**
 * StepItem
 * Single row in the progress step list.
 */
function StepItem({ label, status }) {
    // status: "done" | "active" | "pending"
    const styles = {
        done: {
            dot: "bg-emerald-500/20 text-emerald-400",
            text: "text-slate-600",
        },
        active: {
            dot: "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50",
            text: "text-slate-100 font-medium",
        },
        pending: {
            dot: "bg-white/[0.04] text-slate-700",
            text: "text-slate-800",
        },
    };

    const s = styles[status] ?? styles.pending;

    return (
        <div className="flex items-center gap-3">
            {/* Dot / checkmark */}
            <div
                className={`
          w-5 h-5 rounded-full shrink-0 flex items-center justify-center
          text-[10px] font-bold transition-all duration-300 ${s.dot}
        `}
            >
                {status === "done" && "✓"}
                {status === "active" && <span className="animate-pulse">●</span>}
                {status === "pending" && "·"}
            </div>

            {/* Label */}
            <span className={`text-xs transition-colors duration-300 ${s.text}`}>
                {label}
            </span>
        </div>
    );
}

/**
 * OrbitalSpinner
 * Large decorative SVG spinner used as the hero element on the analyzing screen.
 */
function OrbitalSpinner() {
    return (
        <div className="relative w-28 h-28 mx-auto">
            {/* Outer ring */}
            <svg
                width="112"
                height="112"
                viewBox="0 0 112 112"
                fill="none"
                className="animate-spin-slow absolute inset-0"
            >
                <defs>
                    <linearGradient id="orbGrad" x1="0" y1="0" x2="112" y2="112" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366f1" />
                        <stop offset="1" stopColor="#38bdf8" />
                    </linearGradient>
                </defs>
                {/* Track */}
                <circle
                    cx="56" cy="56" r="52"
                    stroke="rgba(99,102,241,0.12)"
                    strokeWidth="1.5"
                />
                {/* Arc */}
                <circle
                    cx="56" cy="56" r="52"
                    stroke="url(#orbGrad)"
                    strokeWidth="1.5"
                    strokeDasharray="326"
                    strokeDashoffset="200"
                    strokeLinecap="round"
                />
            </svg>

            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
                🔍
            </div>
        </div>
    );
}

/**
 * AnalyzingScreen
 * Full-screen loading state shown while Claude processes the resume.
 *
 * @param {{ stepMsg: string }} props
 */
export function AnalyzingScreen({ stepMsg }) {
    const currentIdx = ANALYSIS_STEPS.indexOf(stepMsg);

    return (
        <div className="min-h-screen bg-[#22222E] flex items-center justify-center p-5">
            <div className="w-full max-w-sm text-center space-y-8">
                {/* Spinner */}
                <OrbitalSpinner />

                {/* Headline */}
                <div>
                    <h2 className="font-cab font-black text-white text-2xl mb-2">
                        Analyzing Resume
                    </h2>
                    <p className="text-indigo-300 text-sm font-medium min-h-[20px]">
                        {stepMsg}
                    </p>
                </div>

                {/* Step list */}
                <div className="space-y-2 text-left">
                    {ANALYSIS_STEPS.map((label, i) => (
                        <StepItem
                            key={label}
                            label={label}
                            status={
                                i < currentIdx
                                    ? "done"
                                    : i === currentIdx
                                        ? "active"
                                        : "pending"
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}