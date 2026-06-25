<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("clientes", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->text("prenom");
            $table->text("nom");
            $table->text("email")->nullable();
            $table->text("telephone")->nullable();
            $table->integer("age")->nullable();
            $table->text("sexe")->nullable();
            $table->text("note_praticien")->nullable();
            $table->text("shopify_customer_id")->nullable();
            $table->timestamps();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->unique(["email", "boutique_id"]);
            $table->index("boutique_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("clientes");
    }
};
