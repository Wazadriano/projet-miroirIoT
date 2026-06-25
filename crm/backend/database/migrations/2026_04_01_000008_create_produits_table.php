<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("produits", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->text("shopify_id")->nullable();
            $table->text("nom");
            $table->text("description")->nullable();
            $table->float("prix")->nullable();
            $table->text("url_produit")->nullable();
            $table->text("image_url")->nullable();
            $table->boolean("mis_en_avant")->default(false);
            $table->boolean("actif")->default(true);
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->index("boutique_id");
        });
        DB::statement("ALTER TABLE produits ADD COLUMN tags text[]");
    }

    public function down(): void
    {
        Schema::dropIfExists("produits");
    }
};
