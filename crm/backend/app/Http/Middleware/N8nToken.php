<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class N8nToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $expected = config('services.n8n.token');

        if (!$token || !$expected || !hash_equals($expected, $token)) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        return $next($request);
    }
}