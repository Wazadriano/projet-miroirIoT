<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("medias", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->text("type");
            $table->text("chemin_fichier");
            $table->text("nom_affichage")->nullable();
            $table->text("checksum");
            $table->integer("ordre_affichage")->nullable();
            $table->boolean("actif")->default(true);
            $table->timestamp("created_at")->useCurrent();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->index("boutique_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("medias");
    }
};
