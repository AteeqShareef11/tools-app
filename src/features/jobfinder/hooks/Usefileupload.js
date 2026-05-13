import { useState, useRef, useCallback } from "react";
import { validateFile } from "../utils";

/**
 * useFileUpload
 *
 * Encapsulates drag-and-drop state and file validation for the upload zone.
 *
 * @param {(file: File) => void} onFileAccepted  called when a valid file is chosen
 */
export function useFileUpload(onFileAccepted) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // File | null
  const [validationErr, setValidationErr] = useState(null); // string | null
  const inputRef = useRef(null);

  // ── internal helpers ─────────────────────────────────────────────────────

  const accept = useCallback(
    (file) => {
      if (!file) return;

      const { valid, reason } = validateFile(file);

      if (!valid) {
        setValidationErr(reason);
        return;
      }

      setValidationErr(null);
      setSelectedFile(file);
      onFileAccepted(file);
    },
    [onFileAccepted],
  );

  // ── drag handlers ────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // only clear when leaving the zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      accept(file);
    },
    [accept],
  );

  // ── input handler ─────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      accept(file);
      // reset so the same file can be re-selected
      e.target.value = "";
    },
    [accept],
  );

  // ── click trigger ─────────────────────────────────────────────────────────

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // ── clear ─────────────────────────────────────────────────────────────────

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationErr(null);
  }, []);

  return {
    // state
    isDragging,
    selectedFile,
    validationErr,
    inputRef,
    // handlers
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    openFilePicker,
    clearFile,
  };
}
