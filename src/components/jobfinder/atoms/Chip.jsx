import { CHIP_VARIANTS } from "../constants";

/**
 * Chip
 * Small tag used to display individual skills, gaps, and strengths.
 *
 * @param {{ label: string; type?: keyof CHIP_VARIANTS; className?: string }} props
 */
export function Chip({ label, type = "primary", className = "" }) {
    const base = CHIP_VARIANTS[type] ?? CHIP_VARIANTS.primary;

    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-1
        rounded-lg text-[11px] font-cab font-medium
        transition-colors duration-150 cursor-default
        ${base} ${className}
      `}
        >
            {label}
        </span>
    );
}