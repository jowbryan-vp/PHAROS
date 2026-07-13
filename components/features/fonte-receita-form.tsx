"use client";

import { useActionState, useState } from "react";
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
  is_recorrente: boolean;
  valor_esperado: number | null;
  dia_esperado: number | null;
};

export function FonteReceitaForm({
  fonte,
  onDone,
}: {
  fonte?: FonteReceita;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveFonteReceita, undefined);
  const [isRecorrente, setIsRecorrente] = useState(fonte?.is_recorrente ?? false);

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
        help="Usado como valor inicial ao lançar receitas dessa fonte."
        defaultChecked={fonte?.tributavel_padrao ?? true}
      />
      <CheckboxField
        name="is_recorrente"
        label="Recorrente"
        help="Marque se essa receita se repete todo ciclo/mês com valor previsível (ex: salário fixo)."
        checked={isRecorrente}
        onChange={(e) => setIsRecorrente(e.target.checked)}
      />

      {isRecorrente && (
        <div className="grid grid-cols-2 gap-3 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <div>
            <Label htmlFor="valor_esperado">Valor esperado</Label>
            <Input
              id="valor_esperado"
              name="valor_esperado"
              type="number"
              step="0.01"
              min="0.01"
              required={isRecorrente}
              defaultValue={fonte?.valor_esperado ?? undefined}
              placeholder="0,00"
            />
          </div>
          <div>
            <Label htmlFor="dia_esperado">Dia esperado</Label>
            <Input
              id="dia_esperado"
              name="dia_esperado"
              type="number"
              min={1}
              max={31}
              step={1}
              required={isRecorrente}
              defaultValue={fonte?.dia_esperado ?? undefined}
              placeholder="Ex.: 5"
            />
          </div>
        </div>
      )}

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
