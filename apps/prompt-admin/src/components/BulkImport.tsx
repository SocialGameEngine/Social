import { useState } from "react";

import { getErrorMessage } from "../utils/get-error-message";

interface BulkImportProps {
  onImport: (prompts: string[]) => Promise<void>;
}

function parseInput(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("JSON must be an array of prompts.");
    }
    return parsed
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }
        if (typeof entry === "object" && entry !== null && "text" in entry) {
          return String((entry as { text: unknown }).text);
        }
        return "";
      })
      .map((text) => text.trim())
      .filter(Boolean);
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes(",")) {
    return lines[0]
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return lines;
}

function BulkImport({ onImport }: BulkImportProps) {
  const [value, setValue] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async (): Promise<void> => {
    if (importing) {
      return;
    }

    setImporting(true);
    try {
      const prompts = parseInput(value);
      if (prompts.length === 0) {
        alert("No prompts found to import.");
        return;
      }
      await onImport(prompts);
      setValue("");
    } catch (error) {
      alert(getErrorMessage(error, "Failed to import prompts"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bulk-import">
      <h3>Bulk Import</h3>
      <p>Paste JSON array, newline list, or comma-separated prompts.</p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={6}
        placeholder='["Prompt 1", "Prompt 2"]'
      />
      <button
        type="button"
        onClick={() => void handleImport()}
        className="btn btn-secondary"
        disabled={importing}
      >
        {importing ? "Importing..." : "Import Prompts"}
      </button>
    </div>
  );
}

export default BulkImport;
