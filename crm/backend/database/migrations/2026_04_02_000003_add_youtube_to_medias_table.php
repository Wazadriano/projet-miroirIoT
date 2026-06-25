<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            // Nullable: only set for type = 'youtube'
            $table->text('url_youtube')->nullable()->after('chemin_fichier');
            // checksum is meaningless for YouTube, make it nullable
            $table->text('checksum')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('medias', function (Blueprint $table) {
            $table->dropColumn('url_youtube');
            $table->text('checksum')->nullable(false)->change();
        });
    }
};
