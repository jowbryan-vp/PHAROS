import { AuthShell } from "@/components/layout/auth-shell";
import { SignupForm } from "@/components/features/signup-form";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastro aberto — qualquer pessoa pode criar a sua conta"
    >
      <SignupForm />
    </AuthShell>
  );
}
