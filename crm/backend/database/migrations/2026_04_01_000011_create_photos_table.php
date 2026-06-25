<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("photos", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("seance_id");
            $table->uuid("boutique_id");
            $table->text("chemin_local");
            $table->text("chemin_serveur")->nullable();
            $table->text("phase");
            $table->jsonb("diagnostic_ia")->nullable();
            $table->text("modele_ia")->nullable();
            $table->integer("latence_ms")->nullable();
            $table->boolean("synced")->default(false);
            $table->timestamp("supprime_local_at")->nullable();
            $table->timestamp("created_at")->useCurrent();
            $table->foreign("seance_id")->references("id")->on("seances")->onDelete("cascade");
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->index("seance_id");
            $table->index("boutique_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("photos");
    }
};
