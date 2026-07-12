"use client";

import { useTransition } from "react";

export function DeleteButton({
  id,
  action,
  confirmMessage,
  className = "",
}: {
  id: string;
  action: (id: string) => Promise<void>;
  confirmMessage: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          action(id);
        });
      }}
      className={`text-sm text-error hover:underline disabled:opacity-50 ${className}`}
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
