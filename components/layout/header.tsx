import { PharosLogo } from "@/components/brand/pharos-logo";
import { ThemeToggle } from "@/components/features/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Header({ email }: { email: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-background px-6 dark:border-neutral-800">
      <PharosLogo width={140} />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
