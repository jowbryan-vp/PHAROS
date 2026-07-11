import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "@/components/features/reset-password-form";

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link de redefinição para o seu e-mail"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
