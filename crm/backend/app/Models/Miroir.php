<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Miroir extends Model
{
    use HasApiTokens, HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'boutique_id',
        'nom',
        'adresse_mac',
        'token_device',
        'en_ligne',
        'derniere_activite',
        'version_app',
    ];

    protected function casts(): array
    {
        return [
            'en_ligne' => 'boolean',
            'derniere_activite' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function seances(): HasMany
    {
        return $this->hasMany(Seance::class);
    }
}
