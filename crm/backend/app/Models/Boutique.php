<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Boutique extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        "nom",
        "email_contact",
        "shopify_domain",
        "shopify_access_token",
    ];

    public function clientes(): HasMany
    {
        return $this->hasMany(Cliente::class);
    }

    public function miroirs(): HasMany
    {
        return $this->hasMany(Miroir::class);
    }

    public function seances(): HasMany
    {
        return $this->hasMany(Seance::class);
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class);
    }

    public function medias(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function configsMiroir(): HasMany
    {
        return $this->hasMany(ConfigMiroir::class);
    }
}
