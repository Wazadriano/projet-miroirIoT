<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoutiqueController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Boutique::withCount(['clientes', 'miroirs', 'seances'])->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'required|string|max:150',
            'email_contact' => 'nullable|email|max:255',
        ]);

        return response()->json(Boutique::create($data), 201);
    }

    public function show(Boutique $boutique): JsonResponse
    {
        return response()->json($boutique->loadCount(['clientes', 'miroirs', 'seances']));
    }

    public function update(Request $request, Boutique $boutique): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'sometimes|string|max:150',
            'email_contact' => 'nullable|email|max:255',
        ]);

        $boutique->update($data);
        return response()->json($boutique);
    }

    public function destroy(Boutique $boutique): JsonResponse
    {
        $boutique->delete();
        return response()->json(null, 204);
    }
}
