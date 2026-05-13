import { SUPPORTED_FORMATS } from "./constants";

/**
 * SupportedFormats
 * Inline row listing accepted file extensions.
 */
export function SupportedFormats() {
    return (
        <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
            {SUPPORTED_FORMATS.map((fmt, i) => (
                <span key={fmt} className="flex items-center gap-1.5">
                    {i > 0 && (
                        <span className="w-1 h-1 rounded-full bg-slate-700 inline-block" />
                    )}
                    {fmt}
                </span>
            ))}
        </div>
    );
}