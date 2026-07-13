"use client";

import { useActionState } from "react";
import { saveGastoFixo } from "@/app/actions/gastos-fixos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/ui/form-message";

type Categoria = { id: string; nome: string };
type Conta = { id: string; nome: string };
type GastoFixo = {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria_id: string;
  conta_pagamento_padrao_id: string | null;
  ativo: boolean;
};

export function GastoFixoForm({
  gastoFixo,
  categorias,
  contas,
  onDone,
}: {
  gastoFixo?: GastoFixo;
  categorias: Categoria[];
  contas: Conta[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveGastoFixo, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {gastoFixo && <input type="hidden" name="id" value={gastoFixo.id} />}
      <input
        type="hidden"
        name="ativo"
        value={(gastoFixo?.ativo ?? true) ? "on" : "off"}
      />

      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={gastoFixo?.nome}
          placeholder="Ex.: Plano de saúde, Financiamento..."
        />
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
            defaultValue={gastoFixo?.valor}
            placeholder="0,00"
          />
        </div>
        <div>
          <Label htmlFor="dia_vencimento">Dia de vencimento</Label>
          <Input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={gastoFixo?.dia_vencimento}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="categoria_id">Categoria</Label>
        <Select
          id="categoria_id"
          name="categoria_id"
          required
          defaultValue={gastoFixo?.categoria_id ?? categorias[0]?.id ?? ""}
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="conta_pagamento_padrao_id">
          Conta de pagamento padrão (opcional)
        </Label>
        <Select
          id="conta_pagamento_padrao_id"
          name="conta_pagamento_padrao_id"
          defaultValue={gastoFixo?.conta_pagamento_padrao_id ?? ""}
        >
          <option value="">Nenhuma</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>

      <FormMessage error={state?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || categorias.length === 0}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
