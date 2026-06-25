<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Jobs\CheckQrAndNotifyJob;
use App\Models\Cliente;
use App\Models\Consentement;
use App\Models\Miroir;
use App\Models\Seance;
use App\Services\RapportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SeanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        return response()->json(
            Seance::whereIn('boutique_id', $boutiqueIds)
                ->with(['cliente:id,prenom,nom,boutique_id', 'miroir:id,nom', 'boutique:id,nom'])
                ->latest('date_debut')
                ->paginate(25)
        );
    }

    public function show(Request $request, Seance $seance): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($seance->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }

        return response()->json(
            $seance->load(['cliente', 'miroir', 'consentement', 'photos'])
        );
    }

    public function triggerN8n(Request $request, Seance $seance): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($seance->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }

        $webhookUrl = config('services.n8n.webhook_seance_fin');

        if (! $webhookUrl) {
            return response()->json([
                'message' => 'N8N_WEBHOOK_SEANCE_FIN non configuré dans .env',
            ], 422);
        }

        $response = Http::timeout(10)->post($webhookUrl, [
            'seance_id'   => $seance->id,
            'boutique_id' => $seance->boutique_id,
            'cliente_id'  => $seance->cliente_id,
        ]);

        return response()->json([
            'message' => 'Webhook N8N déclenché',
            'status'  => $response->status(),
        ]);
    }

    public function testSeance(Request $request): JsonResponse
    {
        $testEmail = config('services.test.client_email', 'thomas.mazeau@icloud.com');

        // Prend la première boutique disponible (toutes les boutiques sont accessibles à tous)
        $boutiqueId = \App\Models\Boutique::value('id');

        if (! $boutiqueId) {
            return response()->json(['message' => 'Aucune boutique disponible pour cet utilisateur'], 422);
        }

        // Crée le client test s'il n'existe pas encore
        $cliente = Cliente::firstOrCreate(
            ['email' => $testEmail, 'boutique_id' => $boutiqueId],
            [
                'prenom' => 'Thomas',
                'nom'    => 'Mazeau',
                'sexe'   => 'M',
            ]
        );

        $miroir = Miroir::where('boutique_id', $boutiqueId)->first();

        if (! $miroir) {
            return response()->json(['message' => 'Aucun miroir pour cette boutique'], 422);
        }

        $consentement = Consentement::create([
            'boutique_id'       => $boutiqueId,
            'cliente_id'        => $cliente->id,
            'texte_consent'     => 'Consentement test automatique.',
            'date_consentement' => now(),
        ]);

        $seance = Seance::create([
            'boutique_id'     => $boutiqueId,
            'miroir_id'       => $miroir->id,
            'cliente_id'      => $cliente->id,
            'consentement_id' => $consentement->id,
            'date_debut'      => now()->subMinutes(30),
            'date_fin'        => now(),
            'email_envoye'    => false,
        ]);

        // Génère le PDF depuis le template DOCX + QR code
        /** @var RapportService $rapportService */
        $rapportService = app(RapportService::class);
        $rapport = $rapportService->generate($seance);

        // Webhook déclenché après 10s si QR non scanné
        CheckQrAndNotifyJob::dispatch($seance->id)
            ->delay(now()->addSeconds(10));

        return response()->json([
            'message'     => 'Séance test créée — webhook dans 10s si QR non scanné',
            'seance'      => $seance->fresh()->load(['cliente:id,prenom,nom,email', 'boutique:id,nom']),
            'rapport_url' => $rapport['rapport_url'],
            'qr_svg'      => $rapport['qr_svg'],
        ], 201);
    }
}
