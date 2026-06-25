<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhotoController extends Controller
{
    /**
     * POST /miroir/photos
     * Upload d'une photo (multipart/form-data) avec métadonnées.
     */
    public function store(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $request->validate([
            'seance_id'      => 'required|uuid|exists:seances,id',
            'photo'          => 'required|file|image|max:10240',
            'phase'          => 'required|in:avant,apres',
            'zone'           => 'required|in:cuir_chevelu,cheveux',
            'diagnostic_ia'  => 'nullable|json',
            'modele_ia'      => 'nullable|string|max:50',
            'latence_ms'     => 'nullable|integer',
        ]);

        $path = $request->file('photo')->store(
            "photos/{$miroir->boutique_id}/{$request->seance_id}",
            'public'
        );

        $photo = Photo::create([
            'seance_id'      => $request->seance_id,
            'boutique_id'    => $miroir->boutique_id,
            'chemin_serveur' => $path,
            'phase'          => $request->phase,
            'zone'           => $request->zone,
            'diagnostic_ia'  => $request->diagnostic_ia
                                    ? json_decode($request->diagnostic_ia, true)
                                    : null,
            'modele_ia'      => $request->modele_ia,
            'latence_ms'     => $request->latence_ms,
            'synced'         => true,
        ]);

        return response()->json($photo, 201);
    }

    /**
     * PATCH /miroir/photos/{photo}
     * Mise à jour du diagnostic IA (envoyé par le miroir après analyse).
     */
    public function update(Request $request, Photo $photo): JsonResponse
    {
        $miroir = $request->user();
        if ($photo->boutique_id !== $miroir->boutique_id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $data = $request->validate([
            'diagnostic_ia' => 'nullable|array',
            'modele_ia'     => 'nullable|string|max:50',
            'latence_ms'    => 'nullable|integer',
        ]);

        $photo->update($data);

        return response()->json($photo);
    }
}
