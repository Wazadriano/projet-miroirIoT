<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Models\Consentement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentementController extends Controller
{
    /**
     * Create a new consent — or return the existing active one (idempotent).
     * The mirror should only show the consent form for first-time clients.
     * For returning clients with an active consent, this endpoint returns it
     * directly without creating a duplicate.
     */
    public function store(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $data = $request->validate([
            'cliente_id'    => 'required|uuid|exists:clientes,id',
            'texte_consent' => 'required|string',
        ]);

        // Return existing active consent if one already exists.
        $existing = Consentement::where('cliente_id', $data['cliente_id'])
            ->where('boutique_id', $miroir->boutique_id)
            ->whereNull('date_revocation')
            ->latest('date_consentement')
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $consentement = Consentement::create([
            'boutique_id'       => $miroir->boutique_id,
            'cliente_id'        => $data['cliente_id'],
            'texte_consent'     => $data['texte_consent'],
            'date_consentement' => now(),
        ]);

        return response()->json($consentement, 201);
    }
}
