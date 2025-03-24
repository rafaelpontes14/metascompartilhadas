/*
  # Create metas table

  1. New Tables
    - `metas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `titulo` (text)
      - `descricao` (text)
      - `categoria` (text)
      - `progresso` (numeric)
      - `objetivo` (numeric)
      - `data_limite` (date)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `metas` table
    - Add policies for authenticated users to:
      - Read their own metas
      - Create new metas
      - Update their own metas
      - Delete their own metas
*/

CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL,
  progresso numeric NOT NULL DEFAULT 0,
  objetivo numeric NOT NULL,
  data_limite date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT categoria_check CHECK (categoria IN ('financeiro', 'viagem', 'pessoal')),
  CONSTRAINT progresso_check CHECK (progresso >= 0),
  CONSTRAINT objetivo_check CHECK (objetivo > 0),
  CONSTRAINT progresso_objetivo_check CHECK (progresso <= objetivo)
);

-- Enable Row Level Security
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own metas"
  ON metas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metas"
  ON metas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas"
  ON metas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas"
  ON metas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);