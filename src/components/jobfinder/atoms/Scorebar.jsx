import { useState, useEffect } from "react";
import { getScoreColor } from "../constants";

/**
 * ScoreBar
 * Animated horizontal bar showing a match percentage (0–100).
 * The fill animates on mount via a CSS transition.
 *
 * @param {{ score: number; showLabel?: boolean; height?: string }} props
 */
export function ScoreBar({ score, showLabel = true, height = "h-1.5" }) {
    const [filled, setFilled] = useState(false);
    const color = getScoreColor(score);

    // trigger fill animation after mount
    useEffect(() => {
        const t = setTimeout(() => setFilled(true), 100);
        return () => clearTimeout(t);
    }, [score]);

    return (
        <div className="flex items-center gap-3">
            {/* Track */}
            <div
                className={`flex-1 ${height} rounded-full score-bar-track overflow-hidden`}
            >
                {/* Fill */}
                <div
                    className="h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                        width: filled ? `${score}%` : "0%",
                        background: color,
                    }}
                />
            </div>

            {/* Label */}
            {showLabel && (
                <span
                    className="text-sm font-cab font-bold shrink-0 tabular-nums"
                    style={{ color, minWidth: 38 }}
                >
                    {score}%
                </span>
            )}
        </div>
    );
}