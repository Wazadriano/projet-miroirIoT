<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Consentement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $miroir = $request->user();
        $query = Cliente::where('boutique_id', $miroir->boutique_id);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'ilike', "%{$search}%")
                    ->orWhere('prenom', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('telephone', 'ilike', "%{$search}%");
            });
        }

        $clientes = $query->orderBy('nom')->get();

        // Attach the latest active consent for each client so the mirror
        // can skip the consent screen for returning clients.
        $clienteIds = $clientes->pluck('id');
        $consentements = Consentement::whereIn('cliente_id', $clienteIds)
            ->whereNull('date_revocation')
            ->orderByDesc('date_consentement')
            ->get()
            ->keyBy('cliente_id');

        $clientes = $clientes->map(function ($c) use ($consentements) {
            $c->consentement_actif = $consentements->get($c->id);
            return $c;
        });

        return response()->json($clientes);
    }

    public function store(Request $request): JsonResponse
    {
        $miroir = $request->user();

        $data = $request->validate([
            'prenom' => 'required|string|max:100',
            'nom' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'date_de_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:F,M,Non précisé',
        ]);

        $data['boutique_id'] = $miroir->boutique_id;
        $cliente = Cliente::create($data);

        return response()->json($cliente, 201);
    }
}
