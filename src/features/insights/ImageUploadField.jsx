import React, { useRef, useState } from "react";

import cn from "../../lib/cn.js";
import { images as imagesApi, imageUrl } from "../../lib/api/endpoints.js";
import { Button } from "../../components/ui/index.js";

// Mirrors images.ALLOWED_INPUT_FORMATS on the server. This only filters the
// file picker - the server re-validates by decoding, and is the authority.
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Pick an image, upload it, and hold onto the id.
 *
 * Uploading happens as soon as a file is chosen rather than on form submit, so
 * the writer sees the real stored image (already re-encoded and resized by the
 * server) before committing, and a validation failure elsewhere in the form
 * never costs them the upload.
 *
 * `value` is a stored image id or null; `onChange` receives the same.
 */
export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  variant = "avatar",
  shape = "circle",
  disabled,
}) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const preview = imageUrl(value);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const stored = await imagesApi.upload(file, variant);
      onChange(stored.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink-700">{label}</span>

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-ink-300 bg-ink-50",
            shape === "circle" ? "h-20 w-20 rounded-full" : "h-20 w-32 rounded-lg",
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              className="h-7 w-7 text-ink-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5 8 11l4 4 3-3 5 5M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"
              />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFile}
            className="sr-only"
            disabled={disabled || isUploading}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={isUploading}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? "Uploading..." : preview ? "Replace" : "Upload"}
            </Button>
            {preview && !isUploading && (
              <Button
                type="button"
                size="sm"
                variant="subtle"
                disabled={disabled}
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>

          {error ? (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
          ) : (
            hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
