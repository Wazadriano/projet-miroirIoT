<?php

namespace App\Http\Controllers\Api\Crm;

use App\Http\Controllers\Controller;
use App\Models\ConfigMiroir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigMiroirController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(ConfigMiroir::global());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'couleur_primaire' => 'sometimes|string|max:7',
            'couleur_fond' => 'sometimes|string|max:7',
            'typographie' => 'sometimes|string|max:50',
            'fond_anime' => 'sometimes|boolean',
            'theme_fond_anime' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:500',
            'volume' => 'sometimes|integer|min:0|max:100',
        ]);

        $config = ConfigMiroir::global();
        $config->update($data);

        return response()->json($config);
    }
}
