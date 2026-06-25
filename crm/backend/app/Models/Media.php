<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasFactory, HasUuids;

    protected $table = "medias";

    public $timestamps = false;

    protected $fillable = [
        "boutique_id",
        "type",
        "chemin_fichier",
        "url_youtube",
        "nom_affichage",
        "checksum",
        "ordre_affichage",
        "actif",
    ];

    protected function casts(): array
    {
        return [
            "ordre_affichage" => "integer",
            "actif" => "boolean",
            "created_at" => "datetime",
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }
}
