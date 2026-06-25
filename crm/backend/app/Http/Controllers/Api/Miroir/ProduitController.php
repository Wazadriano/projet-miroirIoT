<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $produits = Produit::where('boutique_id', $miroir->boutique_id)
            ->where('actif', true)
            ->orderByDesc('mis_en_avant')
            ->orderBy('nom')
            ->get();

        return response()->json($produits);
    }
}