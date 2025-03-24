export interface Meta {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  categoria: 'financeiro' | 'viagem' | 'pessoal';
  progresso: number;
  objetivo: number;
  data_limite: string; // Changed from dataLimite to match database column
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Database {
  public: {
    Tables: {
      metas: {
        Row: Meta;
        Insert: Omit<Meta, 'id' | 'created_at'>;
        Update: Partial<Omit<Meta, 'id' | 'created_at'>>;
      };
    };
  };
}