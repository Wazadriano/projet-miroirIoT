<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Seance extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        "boutique_id",
        "miroir_id",
        "cliente_id",
        "consentement_id",
        "date_debut",
        "date_fin",
        "note_seance",
        "bilan_ia",
        "rapport_pdf_path",
        "rapport_url",
        "qr_scanne_at",
        "email_envoye",
    ];

    protected function casts(): array
    {
        return [
            "date_debut" => "datetime",
            "date_fin" => "datetime",
            "qr_scanne_at" => "datetime",
            "email_envoye" => "boolean",
            "bilan_ia" => "array",
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function miroir(): BelongsTo
    {
        return $this->belongsTo(Miroir::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function consentement(): BelongsTo
    {
        return $this->belongsTo(Consentement::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function produitsRecommandes(): BelongsToMany
    {
        return $this->belongsToMany(Produit::class, 'seance_produits');
    }
}
