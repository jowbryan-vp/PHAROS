import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/features/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta PHAROS">
      <LoginForm />
    </AuthShell>
  );
}
