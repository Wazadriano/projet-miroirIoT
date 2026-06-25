<?php

namespace App\Http\Middleware;

use App\Models\Boutique;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (in_array('super-admin', $roles) && $user->is_admin) {
            return $next($request);
        }

        // Check user role
        if (!in_array($user->role, $roles) && !$user->is_admin) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        // No per-boutique scoping — all users see all boutiques
        $allBoutiqueIds = Boutique::pluck('id')->toArray();
        $request->attributes->set('boutique_id', $allBoutiqueIds[0] ?? null);
        $request->attributes->set('boutique_ids', $allBoutiqueIds);

        return $next($request);
    }
}
