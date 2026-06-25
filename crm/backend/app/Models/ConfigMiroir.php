<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfigMiroir extends Model
{
    use HasFactory, HasUuids;

    protected $table = "config_miroir";

    public $timestamps = false;

    const UPDATED_AT = "updated_at";

    protected $fillable = [
        "couleur_primaire",
        "couleur_fond",
        "typographie",
        "fond_anime",
        "theme_fond_anime",
        "logo_url",
        "volume",
    ];

    protected function casts(): array
    {
        return [
            "fond_anime" => "boolean",
            "volume" => "integer",
        ];
    }

    /**
     * Retourne la config globale unique (singleton).
     */
    public static function global(): self
    {
        return static::firstOrCreate([], [
            'couleur_primaire' => '#8b5cf6',
            'couleur_fond' => '#ffffff',
            'typographie' => 'Inter',
            'fond_anime' => true,
            'volume' => 50,
        ]);
    }
}
