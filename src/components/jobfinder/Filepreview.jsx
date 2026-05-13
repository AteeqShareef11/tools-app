import { formatFileSize, getFileLabel } from "../../features/jobfinder/utils";

/**
 * FilePreview
 * Compact card shown after a file is successfully selected.
 * Displays name, size, type and a clear (×) button.
 *
 * @param {{ file: File; onClear: () => void }} props
 */
export function FilePreview({ file, onClear }) {
    const label = getFileLabel(file);
    const icon = label === "PDF" ? "📕" : "📄";

    return (
        <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.2)",
            }}
        >
            {/* Icon */}
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: "rgba(99,102,241,0.15)" }}
            >
                {icon}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-cab font-medium text-white truncate">
                    {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {formatFileSize(file.size)} · {label}
                </p>
            </div>

            {/* Clear */}
            <button
                onClick={onClear}
                aria-label="Remove file"
                className="text-slate-500 hover:text-red-400 transition-colors text-base leading-none shrink-0 px-1"
            >
                ✕
            </button>
        </div>
    );
}