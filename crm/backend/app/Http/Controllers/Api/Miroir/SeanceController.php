<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Jobs\CheckQrAndNotifyJob;
use App\Models\Consentement;
use App\Models\Seance;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRMarkupSVG;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class SeanceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $data = $request->validate([
            'cliente_id'      => 'required|uuid|exists:clientes,id',
            'consentement_id' => 'nullable|uuid|exists:consentements,id',
        ]);

        // If no consentement_id provided, auto-find the client's active consent.
        if (empty($data['consentement_id'])) {
            $consentement = Consentement::where('cliente_id', $data['cliente_id'])
                ->where('boutique_id', $miroir->boutique_id)
                ->whereNull('date_revocation')
                ->latest('date_consentement')
                ->first();
        } else {
            $consentement = Consentement::find($data['consentement_id']);
        }

        if (!$consentement || $consentement->date_revocation) {
            return response()->json(['message' => 'Aucun consentement valide. Le client doit signer le formulaire de consentement.'], 422);
        }

        $seance = Seance::create([
            'boutique_id'     => $miroir->boutique_id,
            'miroir_id'       => $miroir->id,
            'cliente_id'      => $data['cliente_id'],
            'consentement_id' => $consentement->id,
            'date_debut'      => now(),
        ]);

        return response()->json($seance, 201);
    }

    public function show(Request $request, Seance $seance): JsonResponse
    {
        $miroir = $request->user();
        if ($seance->miroir_id !== $miroir->id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }
        return response()->json($seance->load('photos'));
    }

    public function update(Request $request, Seance $seance): JsonResponse
    {
        $miroir = $request->user();
        if ($seance->miroir_id !== $miroir->id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $data = $request->validate([
            'note_seance' => 'nullable|string',
            'bilan_ia'    => 'nullable|array',
        ]);

        $seance->update($data);

        return response()->json($seance);
    }

    public function fin(Request $request, Seance $seance): JsonResponse
    {
        $miroir = $request->user();
        if ($seance->miroir_id !== $miroir->id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $seance->update(['date_fin' => now()]);

        // Webhook n8n
        $webhookUrl = config('services.n8n.webhook_seance_fin');
        if ($webhookUrl) {
            Http::timeout(5)->post($webhookUrl, [
                'seance_id'   => $seance->id,
                'boutique_id' => $seance->boutique_id,
                'cliente_id'  => $seance->cliente_id,
            ]);
        }

        // Check QR après 10s
        CheckQrAndNotifyJob::dispatch($seance->id)->delay(now()->addSeconds(10));

        return response()->json($seance->load('photos'));
    }

    /**
     * GET /miroir/seances/{seance}/rapport
     * Retourne le rapport PDF + QR SVG.
     * Si le rapport n'est pas encore prêt (N8N), génère-le synchronement en fallback.
     */
    public function rapport(Request $request, Seance $seance): JsonResponse
    {
        $miroir = $request->user();
        if ($seance->miroir_id !== $miroir->id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        // Si N8N a déjà généré le rapport, on le renvoie directement
        if ($seance->rapport_url) {
            return response()->json([
                'rapport_url' => $seance->rapport_url,
                'qr_svg'      => $this->generateQrSvg($seance->rapport_url),
                'ready'       => true,
            ]);
        }

        // Fallback : génération synchrone via DomPDF
        $seance->load(['boutique', 'cliente', 'photos', 'miroir', 'produitsRecommandes']);

        $html = view('pdf.rapport', ['seance' => $seance])->render();
        $pdf  = Pdf::loadHTML($html)->setPaper('a4');

        $filename    = 'rapport-' . $seance->id . '.pdf';
        $storagePath = 'rapports/' . $filename;
        Storage::disk('public')->put($storagePath, $pdf->output());

        $rapportUrl = url('storage/' . $storagePath);
        $seance->update([
            'rapport_pdf_path' => $storagePath,
            'rapport_url'      => $rapportUrl,
        ]);

        return response()->json([
            'rapport_url' => $rapportUrl,
            'qr_svg'      => $this->generateQrSvg($rapportUrl),
            'ready'       => true,
        ]);
    }

    private function generateQrSvg(string $url): string
    {
        $options = new QROptions([
            'outputInterface' => QRMarkupSVG::class,
            'eccLevel'        => EccLevel::M,
            'addQuietzone'    => true,
            'quietzoneSize'   => 2,
            'outputBase64'    => false,
        ]);
        return (new QRCode($options))->render($url);
    }
}
