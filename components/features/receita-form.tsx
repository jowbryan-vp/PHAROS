"use client";

import { useActionState, useState } from "react";
import { saveReceita } from "@/app/actions/receitas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";

type FonteReceita = { id: string; nome: string; tributavel_padrao: boolean };
type Conta = { id: string; nome: string };
type Receita = {
  id: string;
  fonte_receita_id: string;
  conta_id: string;
  valor: number;
  data_recebimento: string;
  tributavel: boolean;
  observacao: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ReceitaForm({
  fontes,
  contas,
  receita,
  onDone,
}: {
  fontes: FonteReceita[];
  contas: Conta[];
  receita?: Receita;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveReceita, undefined);
  const [fonteId, setFonteId] = useState(
    receita?.fonte_receita_id ?? fontes[0]?.id ?? ""
  );
  const [tributavel, setTributavel] = useState(
    receita
      ? receita.tributavel
      : (fontes.find((f) => f.id === fonteId)?.tributavel_padrao ?? true)
  );

  function handleFonteChange(newFonteId: string) {
    setFonteId(newFonteId);
    if (!receita) {
      const fonte = fontes.find((f) => f.id === newFonteId);
      setTributavel(fonte?.tributavel_padrao ?? true);
    }
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {receita && <input type="hidden" name="id" value={receita.id} />}

      <div>
        <Label htmlFor="fonte_receita_id">Fonte de receita</Label>
        <Select
          id="fonte_receita_id"
          name="fonte_receita_id"
          required
          value={fonteId}
          onChange={(e) => handleFonteChange(e.target.value)}
        >
          {fontes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="conta_id">Conta</Label>
        <Select
          id="conta_id"
          name="conta_id"
          required
          defaultValue={receita?.conta_id ?? contas[0]?.id ?? ""}
        >
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={receita?.valor}
            placeholder="0,00"
          />
        </div>
        <div>
          <Label htmlFor="data_recebimento">Data de recebimento</Label>
          <Input
            id="data_recebimento"
            name="data_recebimento"
            type="date"
            required
            defaultValue={receita?.data_recebimento ?? todayISO()}
          />
        </div>
      </div>

      <CheckboxField
        name="tributavel"
        label="Tributável"
        help="Pré-preenchido a partir da fonte escolhida — pode ajustar neste lançamento."
        checked={tributavel}
        onChange={(e) => setTributavel(e.target.checked)}
      />

      <div>
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Textarea
          id="observacao"
          name="observacao"
          rows={2}
          defaultValue={receita?.observacao ?? ""}
        />
      </div>

      <FormMessage error={state?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || fontes.length === 0 || contas.length === 0}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
