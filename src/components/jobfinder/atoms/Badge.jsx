import { BADGE_VARIANTS } from "../constants";

/**
 * Badge
 * Small pill-shaped label for status, location, work-type, etc.
 *
 * @param {{ children: React.ReactNode; variant?: keyof BADGE_VARIANTS; className?: string }} props
 */
export function Badge({ children, variant = "purple", className = "" }) {
    const base = BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.purple;

    return (
        <span
            className={`
        inline-flex items-center px-2 py-0.5
        rounded-lg text-[11px] font-cab font-medium
        ${base} ${className}
      `}
        >
            {children}
        </span>
    );
}