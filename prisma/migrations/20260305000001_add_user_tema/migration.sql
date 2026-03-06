-- Migration: add_user_tema
-- Adiciona o campo `tema` ao model User para persistência do tema da interface
-- entre dispositivos. Valor padrão: 'light'.

ALTER TABLE "User" ADD COLUMN "tema" TEXT NOT NULL DEFAULT 'light';
