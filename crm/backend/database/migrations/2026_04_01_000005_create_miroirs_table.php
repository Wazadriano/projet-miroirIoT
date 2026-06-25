<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("miroirs", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->text("nom")->nullable();
            $table->text("adresse_mac");
            $table->text("token_device");
            $table->boolean("en_ligne")->default(false);
            $table->timestamp("derniere_activite")->nullable();
            $table->text("version_app")->nullable();
            $table->uuid("config_id")->nullable();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->foreign("config_id")->references("id")->on("config_miroir")->onDelete("set null");
            $table->unique("adresse_mac");
            $table->index("boutique_id");
            $table->index("en_ligne");
        });

        Schema::table("config_miroir", function (Blueprint $table) {
            $table->foreign("miroir_id")->references("id")->on("miroirs")->onDelete("set null");
        });
    }

    public function down(): void
    {
        Schema::table("config_miroir", function (Blueprint $table) {
            $table->dropForeign(["miroir_id"]);
        });
        Schema::dropIfExists("miroirs");
    }
};
