"use client";

import { useActionState } from "react";
import { saveFonteReceita } from "@/app/actions/fontes-receita";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";

type FonteReceita = {
  id: string;
  nome: string;
  is_principal: boolean;
  tributavel_padrao: boolean;
};

export function FonteReceitaForm({
  fonte,
  onDone,
}: {
  fonte?: FonteReceita;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveFonteReceita, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {fonte && <input type="hidden" name="id" value={fonte.id} />}
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={fonte?.nome}
          placeholder="Ex.: Salário, Freelance..."
        />
      </div>
      <CheckboxField
        name="is_principal"
        label="Fonte principal"
        help="Só uma fonte pode ser a principal. Marcar esta desmarca a anterior automaticamente."
        defaultChecked={fonte?.is_principal}
      />
      <CheckboxField
        name="tributavel_padrao"
        label="Tributável por padrão"
        help="Usado como valor inicial ao lançar receitas dessa fonte (Etapa 3)."
        defaultChecked={fonte?.tributavel_padrao ?? true}
      />
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
