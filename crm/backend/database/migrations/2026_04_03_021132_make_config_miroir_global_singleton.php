<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Drop foreign key from miroirs → config_miroir
        Schema::table('miroirs', function (Blueprint $table) {
            $table->dropForeign(['config_id']);
            $table->dropColumn('config_id');
        });

        // 2) Drop foreign key + columns from config_miroir
        Schema::table('config_miroir', function (Blueprint $table) {
            $table->dropForeign(['miroir_id']);
            $table->dropForeign(['boutique_id']);
            $table->dropIndex(['boutique_id']);
            $table->dropColumn(['miroir_id', 'boutique_id']);
        });

        // 3) Delete all existing rows, insert a single global config
        DB::table('config_miroir')->delete();
        DB::table('config_miroir')->insert([
            'id' => Str::uuid()->toString(),
            'couleur_primaire' => '#8b5cf6',
            'couleur_fond' => '#ffffff',
            'typographie' => 'Inter',
            'fond_anime' => true,
            'theme_fond_anime' => null,
            'logo_url' => null,
            'volume' => 50,
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Re-add columns
        Schema::table('config_miroir', function (Blueprint $table) {
            $table->uuid('boutique_id')->nullable();
            $table->uuid('miroir_id')->nullable();
            $table->foreign('boutique_id')->references('id')->on('boutiques')->onDelete('cascade');
            $table->foreign('miroir_id')->references('id')->on('miroirs')->onDelete('set null');
            $table->index('boutique_id');
        });

        Schema::table('miroirs', function (Blueprint $table) {
            $table->uuid('config_id')->nullable();
            $table->foreign('config_id')->references('id')->on('config_miroir')->onDelete('set null');
        });
    }
};
