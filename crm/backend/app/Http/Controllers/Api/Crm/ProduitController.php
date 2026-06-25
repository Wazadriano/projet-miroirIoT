<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use App\Services\ShopifyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProduitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        $query = Produit::whereIn('boutique_id', $boutiqueIds);

        if ($search = $request->input('search')) {
            $query->where('nom', 'ilike', '%' . $search . '%');
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        if ($tag = $request->input('tag')) {
            $query->whereRaw("? = ANY(tags)", [$tag]);
        }

        if ($fournisseur = $request->input('fournisseur')) {
            $query->where('fournisseur', $fournisseur);
        }

        $sortBy = $request->input('sort_by', 'nom');
        $sortDir = $request->input('sort_dir', 'asc');
        if (in_array($sortBy, ['nom', 'prix']) && in_array($sortDir, ['asc', 'desc'])) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('nom');
        }

        return response()->json($query->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $boutiqueId = $request->attributes->get('boutique_id') ?? $request->input('boutique_id');
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!$boutiqueId || !in_array($boutiqueId, $boutiqueIds)) {
            return response()->json(['message' => 'boutique_id requis'], 400);
        }

        $data = $request->validate([
            'nom' => 'required|string|max:200',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'prix' => 'nullable|numeric|min:0',
            'url_produit' => 'nullable|url|max:500',
            'image_url' => 'nullable|url|max:500',
            'mis_en_avant' => 'boolean',
            'actif' => 'boolean',
        ]);

        $data['boutique_id'] = $boutiqueId;

        return response()->json(Produit::create($data), 201);
    }

    public function show(Request $request, Produit $produit): JsonResponse
    {
        $this->authorizeBoutique($request, $produit);
        return response()->json($produit);
    }

    public function update(Request $request, Produit $produit): JsonResponse
    {
        $this->authorizeBoutique($request, $produit);

        $data = $request->validate([
            'nom' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'prix' => 'nullable|numeric|min:0',
            'url_produit' => 'nullable|url|max:500',
            'image_url' => 'nullable|url|max:500',
            'mis_en_avant' => 'boolean',
            'actif' => 'boolean',
        ]);

        $produit->update($data);
        return response()->json($produit);
    }

    public function destroy(Request $request, Produit $produit): JsonResponse
    {
        $this->authorizeBoutique($request, $produit);
        $produit->delete();
        return response()->json(null, 204);
    }

    public function syncShopify(Request $request): JsonResponse
    {
        $boutiqueId = $request->attributes->get('boutique_id');
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        // En mode "all", sync dans la première boutique
        if (!$boutiqueId) {
            $boutiqueId = $boutiqueIds[0] ?? null;
        }

        if (!$boutiqueId) {
            return response()->json(['message' => 'Aucune boutique accessible'], 403);
        }

        try {
            $service = new ShopifyService();
            $shopifyProducts = $service->fetchProducts();
        } catch (\Throwable $e) {
            Log::error('Shopify sync failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur de connexion à Shopify : ' . $e->getMessage()], 502);
        }

        $synced = 0;
        $existingShopifyIds = [];
        $domain = $service->getDomain();

        foreach ($shopifyProducts as $sp) {
            $shopifyId = (string) $sp['id'];
            $existingShopifyIds[] = $shopifyId;

            $imageUrl = $sp['image']['src'] ?? ($sp['images'][0]['src'] ?? null);
            $tags = !empty($sp['tags']) ? array_map('trim', explode(',', $sp['tags'])) : [];
            $price = isset($sp['variants'][0]['price']) ? (float) $sp['variants'][0]['price'] : null;

            Produit::updateOrCreate(
                ['boutique_id' => $boutiqueId, 'shopify_id' => $shopifyId],
                [
                    'nom' => $sp['title'],
                    'description' => strip_tags($sp['body_html'] ?? ''),
                    'fournisseur' => $sp['vendor'] ?? null,
                    'tags' => $tags,
                    'prix' => $price,
                    'url_produit' => "https://{$domain}/products/" . ($sp['handle'] ?? ''),
                    'image_url' => $imageUrl,
                    'actif' => ($sp['status'] ?? 'active') === 'active',
                ]
            );
            $synced++;
        }

        // Désactiver les produits supprimés côté Shopify
        if (!empty($existingShopifyIds)) {
            Produit::where('boutique_id', $boutiqueId)
                ->whereNotNull('shopify_id')
                ->whereNotIn('shopify_id', $existingShopifyIds)
                ->update(['actif' => false]);
        }

        return response()->json([
            'message' => "{$synced} produits synchronisés depuis Shopify",
            'synced' => $synced,
        ]);
    }

    private function authorizeBoutique(Request $request, Produit $produit): void
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($produit->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }
}
