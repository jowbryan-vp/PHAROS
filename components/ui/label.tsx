import { LabelHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  const { className = "", ...rest } = props;
  return (
    <label
      className={`mb-1 block text-sm font-medium text-neutral-700 ${className}`}
      {...rest}
    />
  );
}
