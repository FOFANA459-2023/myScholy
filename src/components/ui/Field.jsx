import React, { useId } from "react";

import cn from "../../lib/cn.js";

const CONTROL =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 " +
  "transition-colors disabled:cursor-not-allowed disabled:bg-ink-100";

const NORMAL = "border-ink-300 hover:border-ink-400";
const INVALID = "border-red-400 bg-red-50/40";

/**
 * Label + control + error message, wired together with matching ids and
 * aria-describedby. The old forms repeated this markup in every field and left
 * one label with no text at all.
 */
export function Field({ label, error, hint, required, children, className, id }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({
        id: fieldId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        className: cn(CONTROL, error ? INVALID : NORMAL),
      })}
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} id={props.id}>
      {(fieldProps) => (
        <input
          {...props}
          {...fieldProps}
          className={cn(fieldProps.className, className)}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  rows = 4,
  className,
  ...props
}) {
  return (
    <Field label={label} error={error} hint={hint} required={required} id={props.id}>
      {(fieldProps) => (
        <textarea
          rows={rows}
          {...props}
          {...fieldProps}
          className={cn(fieldProps.className, "resize-y", className)}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  children,
  className,
  ...props
}) {
  return (
    <Field label={label} error={error} hint={hint} required={required} id={props.id}>
      {(fieldProps) => (
        <select
          {...props}
          {...fieldProps}
          className={cn(fieldProps.className, "pr-8", className)}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

export default Field;
