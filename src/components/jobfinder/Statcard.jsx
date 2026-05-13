import { STAT_THEMES } from "./constants";

/**
 * StatCard
 * Compact metric tile used in the candidate banner.
 *
 * @param {{ icon: string; label: string; value: string; color: keyof STAT_THEMES }} props
 */
export function StatCard({ icon, label, value, color = "indigo" }) {
    const theme = STAT_THEMES[color] ?? STAT_THEMES.indigo;

    return (
        <div
            className={`
        p-4 rounded-2xl flex items-center gap-3
        border ${theme.bg} ${theme.border}
      `}
        >
            <span className="text-2xl shrink-0" role="img" aria-label={label}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className={`text-xs font-medium opacity-70 ${theme.text}`}>
                    {label}
                </p>
                <p className={`font-cab font-bold text-sm text-white truncate`}>
                    {value}
                </p>
            </div>
        </div>
    );
}