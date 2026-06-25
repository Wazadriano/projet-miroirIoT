<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Consentement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentementController extends Controller
{
    /**
     * List all consentements for a given client.
     */
    public function index(Request $request, Cliente $cliente): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($cliente->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }

        return response()->json(
            $cliente->consentements()->orderByDesc('date_consentement')->get()
        );
    }

    /**
     * Revoke a consentement (droit de retrait RGPD).
     */
    public function revoquer(Request $request, Consentement $consentement): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($consentement->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }

        if ($consentement->date_revocation) {
            return response()->json(['message' => 'Consentement déjà révoqué'], 422);
        }

        $consentement->update(['date_revocation' => now()]);

        return response()->json($consentement);
    }
}
