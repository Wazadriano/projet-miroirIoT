<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("boutiques", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->text("nom");
            $table->text("email_contact")->nullable();
            $table->text("shopify_domain")->nullable();
            $table->text("shopify_access_token")->nullable();
            $table->timestamp("created_at")->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("boutiques");
    }
};
