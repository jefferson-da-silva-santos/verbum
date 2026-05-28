/**
 * VERBUM — Migration 001: Initial Schema
 *
 * Cria todas as tabelas, índices e configura pragmas de performance.
 * Esta é a migração base — nunca alterar após publicação em produção.
 * Novas mudanças de schema devem gerar um novo arquivo 002_*.ts.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import {
  ALL_CREATE_STATEMENTS,
  CREATE_INDICES,
} from '../schema';

export const migration_001 = {
  version: 1,
  name: 'initial_schema',

  async up(db: SQLiteDatabase): Promise<void> {
    // Criar todas as tabelas em sequência
    for (const statement of ALL_CREATE_STATEMENTS) {
      await db.execAsync(statement);
    }

    // Criar índices (cada CREATE INDEX em chamada separada
    // pois execAsync aceita múltiplos statements apenas com ponto-e-vírgula)
    const indexStatements = CREATE_INDICES
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of indexStatements) {
      await db.execAsync(stmt + ';');
    }
  },
};// Migration: schema inicial
