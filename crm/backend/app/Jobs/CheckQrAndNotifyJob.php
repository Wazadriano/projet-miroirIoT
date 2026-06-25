<?php

namespace App\Jobs;

use App\Models\Seance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckQrAndNotifyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public string $seanceId,
    ) {}

    public function handle(): void
    {
        $seance = Seance::with(['cliente:id,prenom,nom,email', 'boutique:id,nom'])
            ->find($this->seanceId);

        if (! $seance) {
            Log::warning("CheckQrAndNotify: séance {$this->seanceId} introuvable");
            return;
        }

        if ($seance->qr_scanne_at !== null) {
            Log::info("CheckQrAndNotify: séance {$this->seanceId} — QR déjà scanné, skip");
            return;
        }

        $webhookUrl = config('services.nocodeur.webhook_url');

        if (! $webhookUrl) {
            Log::warning('CheckQrAndNotify: NOCODEUR_WEBHOOK_URL non configuré');
            return;
        }

        $payload = [
            'seance_id'        => $seance->id,
            'date_seance'      => $seance->date_debut?->format('d/m/Y H:i'),
            'boutique'         => $seance->boutique?->nom,
            'rapport_pdf'      => $seance->rapport_pdf_path,
            'rapport_url'      => $seance->rapport_url,
            'cliente_prenom'   => $seance->cliente?->prenom,
            'cliente_nom'      => $seance->cliente?->nom,
            'cliente_email'    => $seance->cliente?->email,
        ];

        Log::info("CheckQrAndNotify: envoi webhook pour séance {$this->seanceId}", $payload);
        Log::info("CheckQrAndNotify: URL = {$webhookUrl}");

        $response = Http::timeout(15)->post($webhookUrl, $payload);

        Log::info("CheckQrAndNotify: réponse HTTP {$response->status()}", [
            'body' => $response->body(),
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException("Webhook failed: HTTP {$response->status()}");
        }

        $seance->update(['email_envoye' => true]);
    }
}
