<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RapportController extends Controller
{
    public function scan(Seance $seance): RedirectResponse
    {
        if (!$seance->qr_scanne_at) {
            $seance->update(['qr_scanne_at' => now()]);
        }

        return redirect(url('api/rapports/' . $seance->id . '/pdf'));
    }

    public function pdf(Seance $seance): StreamedResponse
    {
        $path = $seance->rapport_pdf_path;

        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path, basename($path), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }
}
