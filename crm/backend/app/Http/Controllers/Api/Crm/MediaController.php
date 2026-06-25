<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        return response()->json(
            Media::whereIn('boutique_id', $boutiqueIds)
                ->with('boutique:id,nom')
                ->orderBy('ordre_affichage')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $boutiqueId = $request->attributes->get('boutique_id') ?? $request->input('boutique_id');
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!$boutiqueId || !in_array($boutiqueId, $boutiqueIds)) {
            return response()->json(['message' => 'boutique_id requis'], 400);
        }
        $maxOrdre = Media::where('boutique_id', $boutiqueId)->max('ordre_affichage') ?? 0;

        // ── YouTube ──────────────────────────────────────────────────
        if ($request->filled('url_youtube')) {
            $request->validate([
                'url_youtube'   => 'required|url|max:500',
                'nom_affichage' => 'nullable|string|max:150',
            ]);

            // Extract video ID for a canonical URL
            $url = $request->url_youtube;
            preg_match('/(?:v=|youtu\.be\/|embed\/)([\w\-]{11})/', $url, $m);
            $videoId = $m[1] ?? null;

            // Fetch real title from YouTube oEmbed when not provided
            $title = $request->nom_affichage;
            if (!$title && $videoId) {
                try {
                    $oembed = Http::timeout(5)->get('https://www.youtube.com/oembed', [
                        'url'    => "https://www.youtube.com/watch?v={$videoId}",
                        'format' => 'json',
                    ]);
                    $title = $oembed->ok() ? $oembed->json('title') : null;
                } catch (\Exception $e) {
                    $title = null;
                }
            }

            $media = Media::create([
                'boutique_id'      => $boutiqueId,
                'type'             => 'youtube',
                'chemin_fichier'   => '',
                'url_youtube'      => $videoId ? "https://www.youtube.com/watch?v={$videoId}" : $url,
                'nom_affichage'    => $title ?? ($videoId ? "YouTube: {$videoId}" : 'Vidéo YouTube'),
                'checksum'         => null,
                'ordre_affichage'  => $maxOrdre + 1,
                'actif'            => true,
            ]);

            return response()->json($media, 201);
        }

        // ── Fichier (image / vidéo) ───────────────────────────────────
        $request->validate([
            'fichier' => 'required|file|max:102400',
            'type'    => 'required|in:video,image',
            'nom_affichage' => 'nullable|string|max:150',
        ]);

        $file     = $request->file('fichier');
        $path     = $file->store("medias/{$boutiqueId}", 'public');
        $checksum = hash_file('sha256', $file->getRealPath());

        $media = Media::create([
            'boutique_id'     => $boutiqueId,
            'type'            => $request->type,
            'chemin_fichier'  => $path,
            'url_youtube'     => null,
            'nom_affichage'   => $request->nom_affichage ?? $file->getClientOriginalName(),
            'checksum'        => $checksum,
            'ordre_affichage' => $maxOrdre + 1,
            'actif'           => true,
        ]);

        return response()->json($media, 201);
    }

    public function show(Request $request, Media $media): JsonResponse
    {
        return response()->json($media);
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'nom_affichage' => 'sometimes|string|max:150',
            'actif' => 'sometimes|boolean',
        ]);

        $media->update($data);
        return response()->json($media);
    }

    public function destroy(Request $request, Media $media): JsonResponse
    {
        // Delete physical file for image/video (not YouTube)
        if ($media->type !== 'youtube' && $media->chemin_fichier) {
            Storage::disk('public')->delete($media->chemin_fichier);
        }

        $media->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'uuid|exists:medias,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Media::where('id', $id)
                ->update(['ordre_affichage' => $index + 1]);
        }

        return response()->json(['message' => 'Ordre mis à jour']);
    }

    private function authorizeBoutique(Request $request, Media $media): void
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($media->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }
}
