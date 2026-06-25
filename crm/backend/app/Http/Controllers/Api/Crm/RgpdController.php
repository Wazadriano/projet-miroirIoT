<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RgpdController extends Controller
{
    private function authorizeCliente(Request $request, Cliente $cliente): void
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($cliente->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }

    /**
     * Export all personal data for a client (droit d'accès / portabilité RGPD).
     */
    public function exportPersonalData(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeCliente($request, $cliente);

        $data = [
            'exported_at' => now()->toIso8601String(),
            'client'      => $cliente->toArray(),
            'consentements' => $cliente->consentements()->orderByDesc('date_consentement')->get()->toArray(),
            'seances'     => $cliente->seances()
                ->with(['photos:id,seance_id,phase,created_at', 'miroir:id,nom'])
                ->orderByDesc('date_debut')
                ->get()
                ->toArray(),
        ];

        return response()->json($data);
    }

    /**
     * Anonymise all personal data for a client (droit à l'oubli RGPD).
     * Personal identifiers are erased; anonymous statistics are preserved.
     */
    public function anonymiser(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeCliente($request, $cliente);

        // Delete photos from server storage
        foreach ($cliente->photos as $photo) {
            if ($photo->chemin_serveur) {
                Storage::delete($photo->chemin_serveur);
            }
            $photo->update([
                'chemin_serveur' => null,
                'chemin_local'   => null,
                'diagnostic_ia'  => null,
            ]);
        }

        // Revoke all active consentements
        $cliente->consentements()
            ->whereNull('date_revocation')
            ->update(['date_revocation' => now()]);

        // Anonymise the client record
        $cliente->update([
            'prenom'              => 'Anonyme',
            'nom'                 => mb_strtoupper(mb_substr($cliente->id, 0, 8)),
            'email'               => null,
            'telephone'           => null,
            'date_de_naissance'   => null,
            'note_praticien'      => null,
            'shopify_customer_id' => null,
        ]);

        return response()->json(['message' => 'Données personnelles supprimées conformément au RGPD.']);
    }
}
