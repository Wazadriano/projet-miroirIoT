<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    /**
     * Normalize a phone search term to match both +33 and 0x formats.
     */
    private function phoneVariants(string $search): array
    {
        $digits = preg_replace('/[^\d+]/', '', $search);
        $variants = [$search];

        // +33612... → 0612...
        if (str_starts_with($digits, '+33')) {
            $variants[] = '0' . substr($digits, 3);
        } elseif (str_starts_with($digits, '33') && strlen($digits) >= 11) {
            $variants[] = '0' . substr($digits, 2);
        }
        // 06... → +336...
        if (str_starts_with($digits, '0') && strlen($digits) >= 10) {
            $variants[] = '+33' . substr($digits, 1);
        }

        return array_unique($variants);
    }
    public function index(Request $request): JsonResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);

        $query = Cliente::whereIn('boutique_id', $boutiqueIds)->with('boutique:id,nom');

        if ($search = $request->input('search')) {
            $phoneVariants = $this->phoneVariants($search);
            $query->where(function ($q) use ($search, $phoneVariants) {
                $q->whereRaw('unaccent(nom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(prenom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(email) ilike unaccent(?)', ["%{$search}%"]);
                foreach ($phoneVariants as $phone) {
                    $digits = preg_replace('/[^\d+]/', '', $phone);
                    if (strlen($digits) >= 3) {
                        $q->orWhereRaw("regexp_replace(telephone, '[^0-9+]', '', 'g') ilike ?", ['%' . $digits . '%']);
                    }
                }
            });
        }

        return response()->json($query->orderBy('nom')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $boutiqueId = $request->attributes->get('boutique_id') ?? $request->input('boutique_id');
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!$boutiqueId || !in_array($boutiqueId, $boutiqueIds)) {
            return response()->json(['message' => 'boutique_id requis'], 400);
        }

        $data = $request->validate([
            'prenom' => 'required|string|max:100',
            'nom' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'telephone' => ['nullable', 'string', 'max:20', 'regex:/^(\+33\s?\d(\s?\d{2}){4}|0\d(\s?\d{2}){4})$/'],
            'date_de_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:F,M,Non précisé',
            'note_praticien' => 'nullable|string',
            'shopify_customer_id' => 'nullable|string|max:50',
        ]);

        $data['boutique_id'] = $boutiqueId;

        return response()->json(Cliente::create($data), 201);
    }

    public function show(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeBoutique($request, $cliente);
        return response()->json($cliente);
    }

    public function update(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeBoutique($request, $cliente);

        $data = $request->validate([
            'prenom' => 'sometimes|string|max:100',
            'nom' => 'sometimes|string|max:100',
            'email' => 'nullable|email|max:255',
            'telephone' => ['nullable', 'string', 'max:20', 'regex:/^(\+33\s?\d(\s?\d{2}){4}|0\d(\s?\d{2}){4})$/'],
            'date_de_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:F,M,Non précisé',
            'note_praticien' => 'nullable|string',
            'shopify_customer_id' => 'nullable|string|max:50',
        ]);

        $cliente->update($data);
        return response()->json($cliente);
    }

    public function destroy(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeBoutique($request, $cliente);
        $cliente->delete();
        return response()->json(null, 204);
    }

    public function seances(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeBoutique($request, $cliente);
        return response()->json(
            $cliente->seances()->with('photos')->latest('date_debut')->paginate(25)
        );
    }

    /**
     * List all clients across all the user's boutiques.
     */
    public function indexAll(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_admin) {
            $query = Cliente::query();
        } else {
            $boutiqueIds = $user->boutiques()->pluck('boutiques.id')->toArray();
            $query = Cliente::whereIn('boutique_id', $boutiqueIds);
        }

        $query->with('boutique:id,nom');

        if ($search = $request->input('search')) {
            $phoneVariants = $this->phoneVariants($search);
            $query->where(function ($q) use ($search, $phoneVariants) {
                $q->whereRaw('unaccent(nom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(prenom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(email) ilike unaccent(?)', ["%{$search}%"]);
                foreach ($phoneVariants as $phone) {
                    $digits = preg_replace('/[^\d+]/', '', $phone);
                    if (strlen($digits) >= 3) {
                        $q->orWhereRaw("regexp_replace(telephone, '[^0-9+]', '', 'g') ilike ?", ['%' . $digits . '%']);
                    }
                }
            });
        }

        if ($sexe = $request->input('sexe')) {
            $query->where('sexe', $sexe);
        }

        if ($boutiqueId = $request->input('boutique_id')) {
            $query->where('boutique_id', $boutiqueId);
        }

        $sortBy = $request->input('sort_by', 'prenom');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowedSorts = ['nom', 'prenom', 'created_at', 'date_de_naissance'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'prenom';
        if (!in_array($sortDir, ['asc', 'desc'])) $sortDir = 'asc';

        if ($sortBy === 'nom') {
            return response()->json($query->orderByRaw("unaccent(prenom) {$sortDir}")->orderByRaw("unaccent(nom) {$sortDir}")->paginate(25));
        }

        if (in_array($sortBy, ['prenom'])) {
            return response()->json($query->orderByRaw("unaccent({$sortBy}) {$sortDir}")->paginate(25));
        }

        return response()->json($query->orderBy($sortBy, $sortDir)->paginate(25));
    }

    private function authorizeBoutique(Request $request, Cliente $cliente): void
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        if (!in_array($cliente->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }

    private function authorizeClienteAccess(Request $request, Cliente $cliente): void
    {
        $user = $request->user();
        if ($user->is_admin) return;
        $boutiqueIds = $user->boutiques()->pluck('boutiques.id')->toArray();
        if (!in_array($cliente->boutique_id, $boutiqueIds)) {
            abort(403, 'Accès interdit');
        }
    }

    public function showAll(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeClienteAccess($request, $cliente);
        $cliente->load('boutique:id,nom');
        return response()->json($cliente);
    }

    public function updateAll(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeClienteAccess($request, $cliente);

        $data = $request->validate([
            'prenom' => 'sometimes|string|max:100',
            'nom' => 'sometimes|string|max:100',
            'email' => 'nullable|email|max:255',
            'telephone' => ['nullable', 'string', 'max:20', 'regex:/^(\+33\s?\d(\s?\d{2}){4}|0\d(\s?\d{2}){4})$/'],
            'date_de_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:F,M,Non précisé',
            'note_praticien' => 'nullable|string',
            'boutique_id' => 'sometimes|uuid|exists:boutiques,id',
        ]);

        $cliente->update($data);
        $cliente->load('boutique:id,nom');
        return response()->json($cliente);
    }

    public function seancesAll(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorizeClienteAccess($request, $cliente);
        return response()->json(
            $cliente->seances()->with('photos', 'miroir:id,nom')->latest('date_debut')->paginate(25)
        );
    }
}
