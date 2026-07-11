import { AuthShell } from "@/components/layout/auth-shell";
import { UpdatePasswordForm } from "@/components/features/update-password-form";

export default function AtualizarSenhaPage() {
  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma nova senha para sua conta">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
