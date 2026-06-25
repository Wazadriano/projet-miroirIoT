<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("consentements", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->uuid("cliente_id");
            $table->text("texte_consent");
            $table->timestampTz("date_consentement");
            $table->timestamp("date_revocation")->nullable();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->foreign("cliente_id")->references("id")->on("clientes")->onDelete("cascade");
            $table->index("boutique_id");
            $table->index("cliente_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("consentements");
    }
};
