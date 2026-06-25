<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add role column to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('collaborateur')->after('is_admin');
        });

        // Migrate best role from boutique_users into users.role
        if (Schema::hasTable('boutique_users')) {
            DB::statement("
                UPDATE users SET role = 'gerant'
                WHERE id IN (
                    SELECT DISTINCT user_id FROM boutique_users WHERE role = 'gerant'
                )
            ");

            Schema::dropIfExists('boutique_users');
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
