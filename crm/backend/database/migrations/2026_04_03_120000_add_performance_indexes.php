<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // CREATE INDEX CONCURRENTLY ne peut pas s'executer dans une transaction (Postgres).
    // Laravel enveloppe les migrations dans une transaction par defaut : on la desactive
    // pour ce fichier, sinon SQLSTATE 25001 sur un `migrate` a froid.
    public $withinTransaction = false;

    public function up(): void
    {
        // Extension pg_trgm pour les recherches ILIKE efficaces
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Index trigramme sur les colonnes de recherche clientes
        // Nécessaire pour "unaccent(nom) ilike '%...%'" — sans ça : full scan
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_nom_trgm    ON clientes USING gin (nom gin_trgm_ops)');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_prenom_trgm ON clientes USING gin (prenom gin_trgm_ops)');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_email_trgm  ON clientes USING gin (email gin_trgm_ops)');

        // Index B-tree sur date_debut des séances (dashboard stats + tri)
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seances_date_debut ON seances (date_debut)');

        // Index composé boutique_id + date_debut (requêtes dashboard filtrées par boutique)
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seances_boutique_date ON seances (boutique_id, date_debut)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS idx_clientes_nom_trgm');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS idx_clientes_prenom_trgm');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS idx_clientes_email_trgm');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS idx_seances_date_debut');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS idx_seances_boutique_date');
    }
};
