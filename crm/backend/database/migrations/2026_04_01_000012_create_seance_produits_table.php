<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seance_produits', function (Blueprint $table) {
            $table->uuid('seance_id');
            $table->uuid('produit_id');
            $table->primary(['seance_id', 'produit_id']);
            $table->foreign('seance_id')->references('id')->on('seances')->cascadeOnDelete();
            $table->foreign('produit_id')->references('id')->on('produits')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seance_produits');
    }
};
