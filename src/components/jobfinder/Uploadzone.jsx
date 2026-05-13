import { useFileUpload } from "../../features/jobfinder/hooks/Usefileupload";
import { ACCEPTED_EXTENSIONS } from "./constants";
import { FilePreview } from "./Filepreview";
import { SupportedFormats } from "./Supportedformats";


/**
 * UploadZone
 * Drag-and-drop / click-to-browse area with:
 *   • file validation (via useFileUpload)
 *   • scan-line animation while dragging
 *   • FilePreview card when a file is chosen
 *
 * @param {{ onFileSelected: (file: File | null) => void }} props
 */
export function UploadZone({ onFileSelected }) {
    const {
        isDragging,
        selectedFile,
        validationErr,
        inputRef,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleInputChange,
        openFilePicker,
        clearFile,
    } = useFileUpload(onFileSelected);

    const handleClear = () => {
        clearFile();
        onFileSelected(null);
    };

    return (
        <div className="space-y-3">
            {/* Hidden native input */}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="hidden"
                onChange={handleInputChange}
            />

            {!selectedFile ? (
                /* ── Drop target ────────────────────────────────────────── */
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload resume file"
                    className={`upload-dashed rounded-2xl p-10 text-center cursor-pointer relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDragging ? "drag-over" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFilePicker}
                    onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
                >
                    {/* Scan-line overlay while dragging */}
                    {isDragging && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                            <div
                                className="absolute left-0 right-0 h-0.5 animate-[scanLine_1.5s_linear_infinite]"
                                style={{
                                    background:
                                        "linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)",
                                }}
                            />
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4">
                        {/* Icon */}
                        <div
                            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                            style={{
                                background:
                                    "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(59,130,246,0.1))",
                                border: "1px solid rgba(99,102,241,0.2)",
                            }}
                        >
                            {isDragging ? "⬇️" : "📎"}
                        </div>

                        {/* Text */}
                        <div>
                            <p className="font-cab font-bold text-white text-lg">
                                {isDragging ? "Release to upload" : "Drop your resume here"}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                or click to browse your files
                            </p>
                        </div>

                        <SupportedFormats />
                    </div>
                </div>
            ) : (
                /* ── File preview ───────────────────────────────────────── */
                <FilePreview file={selectedFile} onClear={handleClear} />
            )}

            {/* Validation error */}
            {validationErr && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <span>⚠</span> {validationErr}
                </p>
            )}
        </div>
    );
}