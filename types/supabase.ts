export type ModoFinanceiro = "ciclo" | "calendario";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          modo_financeiro: ModoFinanceiro | null;
          onboarding_completo: boolean;
          criado_em: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          email?: string | null;
          modo_financeiro?: ModoFinanceiro | null;
          onboarding_completo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          email?: string | null;
          modo_financeiro?: ModoFinanceiro | null;
          onboarding_completo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      fontes_receita: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          is_principal: boolean;
          tributavel_padrao: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          is_principal?: boolean;
          tributavel_padrao?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          is_principal?: boolean;
          tributavel_padrao?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      contas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          criado_em?: string;
        };
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          is_recorrente: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          is_recorrente?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          is_recorrente?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      subcategorias: {
        Row: {
          id: string;
          categoria_id: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          categoria_id: string;
          nome: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string;
          nome?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
