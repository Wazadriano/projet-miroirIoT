<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Miroir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MiroirController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        return response()->json(
            Miroir::whereIn('boutique_id', $boutiqueIds)->with(['boutique:id,nom'])->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $boutiqueId = $request->attributes->get('boutique_id') ?? $request->input('boutique_id');
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!$boutiqueId || !in_array($boutiqueId, $boutiqueIds)) {
            return response()->json(['message' => 'boutique_id requis'], 400);
        }

        $data = $request->validate([
            'nom' => 'required|string|max:100',
            'adresse_mac' => 'required|string|max:17|unique:miroirs,adresse_mac',
        ]);

        $data['boutique_id'] = $boutiqueId;
        $data['token_device'] = Str::random(64);

        $miroir = Miroir::create($data);

        return response()->json($miroir, 201);
    }

    public function show(Request $request, Miroir $miroir): JsonResponse
    {
        $this->authorizeBoutique($request, $miroir);
        return response()->json($miroir);
    }

    public function update(Request $request, Miroir $miroir): JsonResponse
    {
        $this->authorizeBoutique($request, $miroir);

        $data = $request->validate([
            'nom' => 'sometimes|string|max:100',
        ]);

        $miroir->update($data);
        return response()->json($miroir);
    }

    public function destroy(Request $request, Miroir $miroir): JsonResponse
    {
        $this->authorizeBoutique($request, $miroir);
        $miroir->delete();
        return response()->json(null, 204);
    }

    private function authorizeBoutique(Request $request, Miroir $miroir): void
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($miroir->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }
}
