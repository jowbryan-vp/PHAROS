import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function Header({ email }: { email: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <span className="text-lg font-semibold text-primary">PHAROS</span>
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-sm text-neutral-500">{email}</span>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
