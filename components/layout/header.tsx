import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PharosLogo } from "@/components/brand/pharos-logo";
import { ThemeToggle } from "@/components/features/theme-toggle";

export function Header({ email }: { email: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-background px-6 dark:border-neutral-800">
      <PharosLogo width={140} />
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {email}
          </span>
        )}
        <ThemeToggle />
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
