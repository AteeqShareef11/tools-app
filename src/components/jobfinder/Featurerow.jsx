import { FEATURES } from "./constants";

/**
 * FeatureRow
 * Three-column grid of feature highlights shown below the upload card.
 */
export function FeatureRow() {
    return (
        <div className="grid grid-cols-3 gap-3 mt-6">
            {FEATURES.map(({ icon, title, desc }) => (
                <div
                    key={title}
                    className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
                >
                    <div className="text-2xl mb-2">{icon}</div>
                    <p className="font-cab font-bold text-white text-xs mb-1">{title}</p>
                    <p className="text-slate-600 text-xs leading-snug">{desc}</p>
                </div>
            ))}
        </div>
    );
}