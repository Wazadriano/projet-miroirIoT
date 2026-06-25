<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("config_miroir", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->uuid("miroir_id")->nullable();
            $table->text("couleur_primaire")->nullable();
            $table->text("couleur_fond")->nullable();
            $table->text("typographie")->nullable();
            $table->boolean("fond_anime")->default(true);
            $table->text("theme_fond_anime")->nullable();
            $table->text("logo_url")->nullable();
            $table->integer("volume")->default(50);
            $table->timestamp("updated_at")->useCurrent();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->index("boutique_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("config_miroir");
    }
};
