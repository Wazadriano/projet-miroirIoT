<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Models\ConfigMiroir;
use App\Models\Media;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $wasOffline = !$miroir->en_ligne;
        $miroir->update([
            'en_ligne' => true,
            'derniere_activite' => now(),
        ]);

        if ($wasOffline) {
            \App\Events\MiroirStatusChanged::dispatch($miroir->fresh());
        }

        $medias = Media::where('boutique_id', $miroir->boutique_id)
            ->where('actif', true)
            ->orderBy('ordre_affichage')
            ->get(['id', 'type', 'chemin_fichier', 'nom_affichage', 'checksum']);

        $produits = Produit::where('boutique_id', $miroir->boutique_id)
            ->where('actif', true)
            ->orderByDesc('mis_en_avant')
            ->orderBy('nom')
            ->get();

        return response()->json([
            'config' => ConfigMiroir::global(),
            'medias' => $medias,
            'produits' => $produits,
        ]);
    }
}
