import { InputHTMLAttributes } from "react";

type CheckboxFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
};

export function CheckboxField({
  label,
  help,
  className = "",
  ...rest
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        className={`mt-1 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand dark:border-neutral-600 ${className}`}
        {...rest}
      />
      <span>
        <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
        {help && (
          <span className="block text-xs text-neutral-500 dark:text-neutral-400">
            {help}
          </span>
        )}
      </span>
    </label>
  );
}
