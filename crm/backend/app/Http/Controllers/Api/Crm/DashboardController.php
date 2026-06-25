<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Cliente;
use App\Models\Miroir;
use App\Models\Seance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all boutique IDs the user has access to
        if ($user->is_admin) {
            $boutiqueIds = Boutique::pluck('id')->toArray();
        } else {
            $boutiqueIds = $user->boutiques()->pluck('boutiques.id')->toArray();
        }

        // Cache 5 min par combinaison de boutiques — invalidé via artisan cache:clear
        $cacheKey = 'dashboard_stats_' . md5(implode(',', $boutiqueIds));
        $data = Cache::remember($cacheKey, 300, function () use ($boutiqueIds) {
            return $this->compute($boutiqueIds);
        });

        return response()->json($data);
    }

    private function compute(array $boutiqueIds): array
    {
        $ageDistribution = Cliente::whereIn('boutique_id', $boutiqueIds)
            ->whereNotNull('date_de_naissance')
            ->select(DB::raw("
                CASE
                    WHEN EXTRACT(YEAR FROM age(date_de_naissance)) < 18 THEN '0-17'
                    WHEN EXTRACT(YEAR FROM age(date_de_naissance)) BETWEEN 18 AND 25 THEN '18-25'
                    WHEN EXTRACT(YEAR FROM age(date_de_naissance)) BETWEEN 26 AND 35 THEN '26-35'
                    WHEN EXTRACT(YEAR FROM age(date_de_naissance)) BETWEEN 36 AND 45 THEN '36-45'
                    WHEN EXTRACT(YEAR FROM age(date_de_naissance)) BETWEEN 46 AND 55 THEN '46-55'
                    ELSE '56+'
                END as tranche
            "), DB::raw('count(*) as count'))
            ->groupBy('tranche')
            ->orderByRaw("MIN(EXTRACT(YEAR FROM age(date_de_naissance)))")
            ->get();

        // Gender distribution
        $genderDistribution = Cliente::whereIn('boutique_id', $boutiqueIds)
            ->select(
                DB::raw("COALESCE(sexe, 'Non précisé') as sexe"),
                DB::raw('count(*) as count')
            )
            ->groupBy('sexe')
            ->get();

        // Clients per boutique
        $clientsPerBoutique = Boutique::whereIn('boutiques.id', $boutiqueIds)
            ->leftJoin('clientes', 'boutiques.id', '=', 'clientes.boutique_id')
            ->select('boutiques.id', 'boutiques.nom', DB::raw('count(clientes.id) as count'))
            ->groupBy('boutiques.id', 'boutiques.nom')
            ->orderBy('boutiques.nom')
            ->get();

        // Total clients
        $totalClients = Cliente::whereIn('boutique_id', $boutiqueIds)->count();

        // Seances today
        $today = now()->toDateString();
        $seancesToday = Seance::whereIn('boutique_id', $boutiqueIds)
            ->whereDate('date_debut', $today)
            ->count();

        // Seances this month
        $seancesMonth = Seance::whereIn('boutique_id', $boutiqueIds)
            ->whereYear('date_debut', now()->year)
            ->whereMonth('date_debut', now()->month)
            ->count();

        // Miroirs
        $totalMiroirs = Miroir::whereIn('boutique_id', $boutiqueIds)->count();
        $miroirsOnline = Miroir::whereIn('boutique_id', $boutiqueIds)->where('en_ligne', true)->count();
        $offlineMiroirs = Miroir::whereIn('boutique_id', $boutiqueIds)
            ->where('en_ligne', false)
            ->select('id', 'nom', 'adresse_mac')
            ->get();

        // Weekly seances
        $weekStart = now()->subDays(6)->toDateString();
        $weeklySeances = Seance::whereIn('boutique_id', $boutiqueIds)
            ->whereDate('date_debut', '>=', $weekStart)
            ->select(DB::raw("DATE(date_debut) as day"), DB::raw('count(*) as count'))
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('count', 'day');

        return [
            'age_distribution'     => $ageDistribution->toArray(),
            'gender_distribution'  => $genderDistribution->toArray(),
            'clients_per_boutique' => $clientsPerBoutique->toArray(),
            'total_clients'        => $totalClients,
            'seances_today'        => $seancesToday,
            'seances_month'        => $seancesMonth,
            'miroirs_total'        => $totalMiroirs,
            'miroirs_online'       => $miroirsOnline,
            'offline_miroirs'      => $offlineMiroirs->toArray(),
            'weekly_seances'       => $weeklySeances->toArray(),
        ];
    }
}
