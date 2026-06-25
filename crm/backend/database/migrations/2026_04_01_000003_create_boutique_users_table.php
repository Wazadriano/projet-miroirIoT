<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("boutique_users", function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->uuid("boutique_id");
            $table->uuid("user_id");
            $table->text("role");
            $table->timestamp("created_at")->useCurrent();
            $table->foreign("boutique_id")->references("id")->on("boutiques")->onDelete("cascade");
            $table->foreign("user_id")->references("id")->on("users")->onDelete("cascade");
            $table->unique(["boutique_id", "user_id"]);
            $table->index("user_id");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("boutique_users");
    }
};
