<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Produit extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        "boutique_id",
        "shopify_id",
        "nom",
        "description",
        "fournisseur",
        "tags",
        "prix",
        "url_produit",
        "image_url",
        "mis_en_avant",
        "actif",
    ];

    protected function casts(): array
    {
        return [
            "prix" => "float",
            "mis_en_avant" => "boolean",
            "actif" => "boolean",
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function getTagsAttribute($value): array
    {
        if ($value === null) return [];
        $value = trim($value, "{}");
        return $value === "" ? [] : explode(",", $value);
    }

    public function setTagsAttribute($value): void
    {
        if (is_array($value)) {
            $this->attributes["tags"] = "{" . implode(",", $value) . "}";
        } else {
            $this->attributes["tags"] = $value;
        }
    }
}
