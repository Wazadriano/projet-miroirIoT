<?php

namespace App\Http\Controllers\Api\N8n;

use App\Http\Controllers\Controller;
use App\Models\Seance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeanceController extends Controller
{
    public function rapport(Request $request, Seance $seance): JsonResponse
    {
        $data = $request->validate([
            'rapport_pdf_path' => 'required|string|max:500',
            'rapport_url' => 'required|url|max:500',
        ]);

        $seance->update($data);

        return response()->json($seance);
    }

    public function nonScannees(): JsonResponse
    {
        $seances = Seance::whereNotNull('date_fin')
            ->whereNull('qr_scanne_at')
            ->where('email_envoye', false)
            ->where('date_fin', '<=', now()->subHour())
            ->with(['cliente:id,prenom,nom,email', 'boutique:id,nom'])
            ->get();

        return response()->json($seances);
    }

    public function emailEnvoye(Seance $seance): JsonResponse
    {
        $seance->update(['email_envoye' => true]);
        return response()->json($seance);
    }

    /**
     * Retourne le bilan d'une séance au format attendu par le template Carbone / N8N.
     */
    public function bilan(Seance $seance): JsonResponse
    {
        $seance->load(['boutique:id,nom', 'cliente', 'photos', 'miroir', 'produitsRecommandes']);

        $photoUrl = fn($photo) => $photo?->chemin_serveur
            ? url('storage/' . $photo->chemin_serveur)
            : null;

        // Photos triées : avant d'abord, après ensuite
        $avant = $seance->photos->where('phase', 'avant')->values();
        $apres = $seance->photos->where('phase', 'apres')->values();

        return response()->json([
            'id'            => $seance->id,
            'boutique_id'   => $seance->boutique_id,
            'date_debut'    => $seance->date_debut?->toIso8601String(),
            'praticienne'   => $seance->miroir?->nom ?? 'Miroir',

            'boutique' => [
                'nom' => $seance->boutique?->nom,
            ],

            'cliente' => [
                'nom'        => $seance->cliente?->nom,
                'prenom'     => $seance->cliente?->prenom,
                'sexe'       => $seance->cliente?->sexe,
                'date_de_naissance' => $seance->cliente?->date_de_naissance?->format('Y-m-d'),
                'created_at' => $seance->cliente?->created_at,
            ],

            'photos' => $seance->photos->sortBy('phase')->values()->map(fn($p) => [
                'phase'          => $p->phase,
                'chemin_serveur' => $photoUrl($p),
                'diagnostic_ia'  => $p->diagnostic_ia,
            ]),

            'photos_avant' => $avant->map(fn($p) => [
                'chemin_serveur' => $photoUrl($p),
                'diagnostic_ia'  => $p->diagnostic_ia,
            ])->values(),

            'photos_apres' => $apres->map(fn($p) => [
                'chemin_serveur' => $photoUrl($p),
                'diagnostic_ia'  => $p->diagnostic_ia,
            ])->values(),

            'bilan_global_ia' => $seance->bilan_ia,

            'produits' => $seance->produitsRecommandes->map(fn($p) => [
                'nom'         => $p->nom,
                'image_url'   => $p->image_url,
                'url_produit' => $p->url_produit,
                'prix'        => $p->prix,
            ])->values(),
        ]);
    }
}
