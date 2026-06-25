<?php

namespace App\Http\Controllers\Api\N8n;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function aSupprimer(): JsonResponse
    {
        $photos = Photo::whereNotNull('supprime_local_at')
            ->whereNotNull('chemin_serveur')
            ->where('synced', true)
            ->get(['id', 'chemin_serveur', 'seance_id']);

        return response()->json($photos);
    }

    public function supprimerServeur(Photo $photo): JsonResponse
    {
        if ($photo->chemin_serveur) {
            Storage::disk('public')->delete($photo->chemin_serveur);
        }

        $photo->update(['chemin_serveur' => null]);

        return response()->json(['message' => 'Fichier supprimé']);
    }
}