<?php

namespace App\Services;

use App\Models\Seance;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRMarkupSVG;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\TemplateProcessor;

class RapportService
{
    private string $templatePath;

    public function __construct()
    {
        $this->templatePath = resource_path('templates/template.docx');
    }

    /**
     * Génère le PDF (depuis template DOCX) + QR code pour une séance.
     * Met à jour seance.rapport_pdf_path et seance.rapport_url.
     *
     * @return array{ rapport_url: string, qr_svg: string }
     */
    public function generate(Seance $seance): array
    {
        $seance->loadMissing(['boutique', 'cliente', 'miroir']);

        if (! file_exists($this->templatePath)) {
            throw new \RuntimeException('Template introuvable : ' . $this->templatePath);
        }

        $storagePath = 'rapports/rapport-' . $seance->id . '.pdf';
        $pdfUrl      = $this->generatePdf($seance, $storagePath);
        $scanUrl     = config('app.url') . '/api/rapports/' . $seance->id . '/scan';
        $qrSvg       = $this->makeQrSvg($scanUrl);

        $seance->update([
            'rapport_pdf_path' => $storagePath,
            'rapport_url'      => $pdfUrl,
        ]);

        return [
            'rapport_url' => $pdfUrl,
            'qr_svg'      => $qrSvg,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function generatePdf(Seance $seance, string $storagePath): string
    {
        $processor = new TemplateProcessor($this->templatePath);

        $cliente  = $seance->cliente;
        $boutique = $seance->boutique;

        $age = $cliente?->date_de_naissance
            ? (int) \Carbon\Carbon::parse($cliente->date_de_naissance)->age
            : '';

        $processor->setValue('d.nom',             $cliente?->nom    ?? '');
        $processor->setValue('d.prenom',          $cliente?->prenom ?? '');
        $processor->setValue('d.sexe',            $cliente?->sexe   ?? '');
        $processor->setValue('d.age',             $age);
        $processor->setValue('d.boutique',        $boutique?->nom   ?? '');
        $processor->setValue('d.date_inscription', $cliente?->created_at?->format('d/m/Y') ?? '');

        $tempDocx = sys_get_temp_dir() . '/kbeauty_' . $seance->id . '.docx';
        $processor->saveAs($tempDocx);

        // DOCX → PhpWord HTML writer → DomPDF
        $phpWord    = IOFactory::load($tempDocx);
        $htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
        $tempHtml   = sys_get_temp_dir() . '/kbeauty_' . $seance->id . '.html';
        $htmlWriter->save($tempHtml);

        $html = file_get_contents($tempHtml);

        @unlink($tempDocx);
        @unlink($tempHtml);

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        Storage::disk('public')->put($storagePath, $pdf->output());

        return url('api/rapports/' . $seance->id . '/pdf');
    }



    private function makeQrSvg(string $url): string
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
