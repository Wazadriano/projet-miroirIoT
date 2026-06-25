<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("seances", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->uuid("miroir_id");
            $table->uuid("cliente_id");
            $table->uuid("consentement_id");
            $table->timestamp("date_debut");
            $table->timestamp("date_fin")->nullable();
            $table->text("note_seance")->nullable();
            $table->text("rapport_pdf_path")->nullable();
            $table->text("rapport_url")->nullable();
            $table->timestamp("qr_scanne_at")->nullable();
            $table->boolean("email_envoye")->default(false);
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->foreign("miroir_id")->references("id")->on("miroirs")->onDelete("restrict");
            $table->foreign("cliente_id")->references("id")->on("clientes")->onDelete("cascade");
            $table->foreign("consentement_id")->references("id")->on("consentements")->onDelete("restrict");
            $table->index("boutique_id");
            $table->index("miroir_id");
            $table->index("cliente_id");
            $table->index("consentement_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("seances");
    }
};
