export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  return (
    <p
      role="status"
      className={`rounded-md px-3 py-2 text-sm ${
        error
          ? "bg-error/10 text-error"
          : "bg-success/10 text-success"
      }`}
    >
      {error ?? success}
    </p>
  );
}
