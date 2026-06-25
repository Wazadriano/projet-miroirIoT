<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Cliente extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        "boutique_id",
        "prenom",
        "nom",
        "email",
        "telephone",
        "date_de_naissance",
        "sexe",
        "note_praticien",
        "shopify_customer_id",
    ];

    protected function casts(): array
    {
        return [
            "date_de_naissance" => "date",
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function consentements(): HasMany
    {
        return $this->hasMany(Consentement::class);
    }

    public function seances(): HasMany
    {
        return $this->hasMany(Seance::class);
    }

    public function photos(): HasManyThrough
    {
        return $this->hasManyThrough(Photo::class, Seance::class);
    }
}
