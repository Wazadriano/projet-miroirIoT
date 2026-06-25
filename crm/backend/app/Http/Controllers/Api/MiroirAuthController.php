<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Miroir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MiroirAuthController extends Controller
{
    public function auth(Request $request): JsonResponse
    {
        $request->validate([
            'adresse_mac' => 'required|string',
            'token_device' => 'required|string',
        ]);

        $miroir = Miroir::where('adresse_mac', $request->adresse_mac)
            ->where('token_device', $request->token_device)
            ->first();

        if (!$miroir) {
            return response()->json(['message' => 'Miroir non reconnu'], 401);
        }

        $miroir->update([
            'en_ligne' => true,
            'derniere_activite' => now(),
        ]);

        \App\Events\MiroirStatusChanged::dispatch($miroir->fresh());

        // Supprime uniquement les tokens expirés, pas tous — évite la race condition
        // quand reAuthenticate() est appelée deux fois en parallèle
        $miroir->tokens()->where('expires_at', '<', now())->delete();
        $token = $miroir->createToken('miroir', ['miroir'], now()->addYear())->plainTextToken;

        $medias = \App\Models\Media::where('boutique_id', $miroir->boutique_id)
            ->where('actif', true)
            ->orderBy('ordre_affichage')
            ->get(['id', 'type', 'chemin_fichier', 'nom_affichage', 'checksum']);

        $produits = \App\Models\Produit::where('boutique_id', $miroir->boutique_id)
            ->where('actif', true)
            ->orderByDesc('mis_en_avant')
            ->orderBy('nom')
            ->get();

        return response()->json([
            'token' => $token,
            'miroir' => $miroir,
            'config' => \App\Models\ConfigMiroir::global(),
            'medias' => $medias,
            'produits' => $produits,
            'boutique_id' => $miroir->boutique_id,
        ]);
    }
}
