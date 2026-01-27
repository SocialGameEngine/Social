import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  characterCount?: { value: number; max: number };
};

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ label, hint, error, characterCount, className, id, ...props }, ref) => {
  const textAreaId = id ?? props.name;
  return (
    <label
      className="flex w-full flex-col gap-2 text-left"
      htmlFor={textAreaId}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {characterCount ? (
          <span className="text-xs text-slate-500">
            {characterCount.value}/{characterCount.max}
          </span>
        ) : null}
      </div>
      <textarea
        ref={ref}
        id={textAreaId}
        className={clsx(
          "min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-light",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-200",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
});

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;
