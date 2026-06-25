<?php

namespace App\Http\Controllers\Api\Miroir;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HeartbeatController extends Controller
{
    public function handle(Request $request)
    {
        $request->user()->update([
            'en_ligne'           => true,
            'derniere_activite'  => now(),
        ]);
        return response()->json(['ok' => true]);
    }
}
