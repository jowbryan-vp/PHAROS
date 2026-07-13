"use client";

import { useTransition } from "react";

export function DeleteButton({
  id,
  action,
  confirmMessage,
  className = "",
}: {
  id: string;
  action: (id: string) => Promise<{ warning?: string } | void>;
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
        startTransition(async () => {
          const result = await action(id);
          if (result?.warning) window.alert(result.warning);
        });
      }}
      className={`text-sm text-error hover:underline disabled:opacity-50 ${className}`}
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
