<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->date('date_de_naissance')->nullable()->after('telephone');
            $table->dropColumn('age');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->integer('age')->nullable()->after('telephone');
            $table->dropColumn('date_de_naissance');
        });
    }
};
