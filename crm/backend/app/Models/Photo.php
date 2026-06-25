<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        "seance_id",
        "boutique_id",
        "chemin_local",
        "chemin_serveur",
        "phase",
        "zone",
        "diagnostic_ia",
        "modele_ia",
        "latence_ms",
        "synced",
        "supprime_local_at",
    ];

    protected function casts(): array
    {
        return [
            "diagnostic_ia" => "array",
            "synced" => "boolean",
            "latence_ms" => "integer",
            "supprime_local_at" => "datetime",
            "created_at" => "datetime",
        ];
    }

    public function seance(): BelongsTo
    {
        return $this->belongsTo(Seance::class);
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }
}
