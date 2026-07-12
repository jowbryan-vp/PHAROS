"use client";

import { useState } from "react";
import { deleteCategoria, deleteSubcategoria } from "@/app/actions/categorias";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { CategoriaForm } from "@/components/features/categoria-form";
import { SubcategoriaForm } from "@/components/features/subcategoria-form";

type Subcategoria = { id: string; nome: string };
type Categoria = {
  id: string;
  nome: string;
  is_recorrente: boolean;
  subcategorias: Subcategoria[];
};

export function CategoriaItem({ categoria }: { categoria: Categoria }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingSub, setCreatingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  if (editing) {
    return <CategoriaForm categoria={categoria} onDone={() => setEditing(false)} />;
  }

  return (
    <li className="rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span
            className={`text-neutral-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            &#9656;
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {categoria.nome}
          </span>
          {categoria.is_recorrente && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Recorrente
            </span>
          )}
          <span className="text-xs text-neutral-400">
            {categoria.subcategorias.length}{" "}
            {categoria.subcategorias.length === 1
              ? "subcategoria"
              : "subcategorias"}
          </span>
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-brand hover:underline"
          >
            Editar
          </button>
          <DeleteButton
            id={categoria.id}
            action={deleteCategoria}
            confirmMessage={`Excluir a categoria "${categoria.nome}" e todas as suas subcategorias?`}
          />
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
          {categoria.subcategorias.length === 0 && !creatingSub && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Nenhuma subcategoria ainda.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {categoria.subcategorias.map((sub) =>
              editingSubId === sub.id ? (
                <li key={sub.id}>
                  <SubcategoriaForm
                    categoriaId={categoria.id}
                    subcategoria={sub}
                    onDone={() => setEditingSubId(null)}
                  />
                </li>
              ) : (
                <li
                  key={sub.id}
                  className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {sub.nome}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingSubId(sub.id)}
                      className="text-xs text-brand hover:underline"
                    >
                      Editar
                    </button>
                    <DeleteButton
                      id={sub.id}
                      action={deleteSubcategoria}
                      confirmMessage={`Excluir a subcategoria "${sub.nome}"?`}
                      className="text-xs"
                    />
                  </div>
                </li>
              )
            )}
          </ul>

          {creatingSub ? (
            <SubcategoriaForm
              categoriaId={categoria.id}
              onDone={() => setCreatingSub(false)}
            />
          ) : (
            <Button
              variant="ghost"
              onClick={() => setCreatingSub(true)}
              className="self-start"
            >
              + Nova subcategoria
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
