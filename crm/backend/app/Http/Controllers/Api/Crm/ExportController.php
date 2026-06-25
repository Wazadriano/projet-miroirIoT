<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Seance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function shopify(Request $request): JsonResponse
    {
        // TODO: Implémentation export vers Shopify
        return response()->json(['message' => 'Export Shopify non encore implémenté'], 501);
    }

    public function csv(Request $request): StreamedResponse
    {
        $boutiqueIds = $request->attributes->get('boutique_ids', []);
        $type = $request->input('type', 'clientes');

        return response()->streamDownload(function () use ($boutiqueIds, $type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'seances') {
                fputcsv($handle, ['ID', 'Cliente', 'Miroir', 'Date début', 'Date fin', 'Note']);
                Seance::whereIn('boutique_id', $boutiqueIds)
                    ->with(['cliente:id,prenom,nom', 'miroir:id,nom'])
                    ->orderByDesc('date_debut')
                    ->chunk(500, function ($seances) use ($handle) {
                        foreach ($seances as $s) {
                            fputcsv($handle, [
                                $s->id,
                                $s->cliente?->prenom . ' ' . $s->cliente?->nom,
                                $s->miroir?->nom,
                                $s->date_debut,
                                $s->date_fin,
                                $s->note_seance,
                            ]);
                        }
                    });
            } else {
                fputcsv($handle, ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Sexe', 'Date de naissance', 'Note praticien', 'Shopify ID', 'Créé le']);
                Cliente::whereIn('boutique_id', $boutiqueIds)
                    ->orderBy('nom')
                    ->chunk(500, function ($clientes) use ($handle) {
                        foreach ($clientes as $c) {
                            fputcsv($handle, [
                                $c->id,
                                $c->prenom,
                                $c->nom,
                                $c->email,
                                $c->telephone,
                                match ($c->sexe) {
                                    'F' => 'Femme',
                                    'M' => 'Homme',
                                    default => $c->sexe
                                },
                                $c->date_de_naissance?->format('d/m/Y'),
                                $c->note_praticien,
                                $c->shopify_customer_id,
                                $c->created_at?->format('d/m/Y H:i'),
                            ]);
                        }
                    });
            }

            fclose($handle);
        }, "export-{$type}.csv", ['Content-Type' => 'text/csv']);
    }

    public function allClientesCsv(Request $request): StreamedResponse
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
            $digits = preg_replace('/[^\d+]/', '', $search);
            $query->where(function ($q) use ($search, $digits) {
                $q->whereRaw('unaccent(nom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(prenom) ilike unaccent(?)', ["%{$search}%"])
                    ->orWhereRaw('unaccent(email) ilike unaccent(?)', ["%{$search}%"]);
                if (strlen($digits) >= 3) {
                    $q->orWhereRaw("regexp_replace(telephone, '[^0-9+]', '', 'g') ilike ?", ['%' . $digits . '%']);
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
            $query->orderByRaw("unaccent(prenom) {$sortDir}")->orderByRaw("unaccent(nom) {$sortDir}");
        } elseif ($sortBy === 'prenom') {
            $query->orderByRaw("unaccent(prenom) {$sortDir}");
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Prénom', 'Nom', 'Email', 'Téléphone', 'Sexe', 'Date de naissance', 'Boutique']);
            $query->chunk(500, function ($clientes) use ($handle) {
                foreach ($clientes as $c) {
                    fputcsv($handle, [
                        $c->prenom,
                        $c->nom,
                        $c->email,
                        $c->telephone,
                        match ($c->sexe) {
                            'F' => 'Femme',
                            'M' => 'Homme',
                            default => $c->sexe
                        },
                        $c->date_de_naissance?->format('d/m/Y'),
                        $c->boutique?->nom,
                    ]);
                }
            });
            fclose($handle);
        }, 'clients.csv', ['Content-Type' => 'text/csv']);
    }
}
