<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhotoController extends Controller
{
    /**
     * PATCH /photos/{photo}/diagnostic
     * Permet au praticien d'ajuster le diagnostic IA depuis le CRM.
     */
    public function updateDiagnostic(Request $request, Photo $photo): JsonResponse
    {
        $user = $request->user();
        if ($photo->boutique_id !== $user->boutique_id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $data = $request->validate([
            'diagnostic_ia'                          => 'required|array',
            'diagnostic_ia.score_global'             => 'required|integer|min:0|max:100',
            'diagnostic_ia.commentaire'              => 'required|string',
            'diagnostic_ia.categories'               => 'required|array',
            'diagnostic_ia.categories.*.nom'         => 'required|string',
            'diagnostic_ia.categories.*.score'       => 'required|integer|min:0|max:100',
            'diagnostic_ia.categories.*.niveau'      => 'required|string',
            'diagnostic_ia.produits_recommandes'     => 'nullable|array',
            'diagnostic_ia.produits_recommandes.*'   => 'string',
        ]);

        $photo->update(['diagnostic_ia' => $data['diagnostic_ia']]);

        return response()->json($photo);
    }
}
