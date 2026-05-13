/**
 * Spinner
 * Lightweight SVG spinner for loading states.
 *
 * @param {{ size?: number; color?: string; trackColor?: string }} props
 */
export function Spinner({
    size = 24,
    color = "#6366f1",
    trackColor = "rgba(255,255,255,0.1)",
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading"
            className="animate-spin"
            style={{ animationDuration: "0.9s" }}
        >
            {/* Track */}
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={trackColor}
                strokeWidth="2.5"
            />
            {/* Arc */}
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}