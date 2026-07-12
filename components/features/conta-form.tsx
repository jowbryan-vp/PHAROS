"use client";

import { useActionState } from "react";
import { saveConta } from "@/app/actions/contas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

type Conta = { id: string; nome: string };

export function ContaForm({
  conta,
  onDone,
}: {
  conta?: Conta;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveConta, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {conta && <input type="hidden" name="id" value={conta.id} />}
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={conta?.nome}
          placeholder="Ex.: Nubank, Caixa, Carteira..."
        />
      </div>
      <FormMessage error={state?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
