<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\MiroirAuthController;
use App\Http\Controllers\Api\RapportController;
use App\Http\Controllers\Api\Miroir as MiroirApi;
use App\Http\Controllers\Api\Crm;
use App\Http\Controllers\Api\N8n;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('reset-password', [PasswordResetController::class, 'reset']);
Route::post('miroir/auth', [MiroirAuthController::class, 'auth']);
Route::get('rapports/{seance}/scan', [RapportController::class, 'scan']);
Route::get('rapports/{seance}/pdf', [RapportController::class, 'pdf']);

/*
|--------------------------------------------------------------------------
| Miroir (device token)
|--------------------------------------------------------------------------
*/
Route::prefix('miroir')->middleware('auth:sanctum')->group(function () {
    Route::get('clientes', [MiroirApi\ClienteController::class, 'index']);
    Route::post('clientes', [MiroirApi\ClienteController::class, 'store']);
    Route::post('consentements', [MiroirApi\ConsentementController::class, 'store']);
    Route::post('seances', [MiroirApi\SeanceController::class, 'store']);
    Route::patch('seances/{seance}', [MiroirApi\SeanceController::class, 'update']);
    Route::post('seances/{seance}/fin', [MiroirApi\SeanceController::class, 'fin']);
    Route::get('seances/{seance}', [MiroirApi\SeanceController::class, 'show']);
    Route::get('seances/{seance}/rapport', [MiroirApi\SeanceController::class, 'rapport']);
    Route::post('photos', [MiroirApi\PhotoController::class, 'store']);
    Route::patch('photos/{photo}', [MiroirApi\PhotoController::class, 'update']);
    Route::get('config', [MiroirApi\ConfigController::class, 'show']);
    Route::post('heartbeat', function (\Illuminate\Http\Request $request) {
        $miroir = $request->user();
        $wasOffline = !$miroir->en_ligne; // capturer AVANT update (syncOriginal écrase getOriginal)
        $miroir->update(['en_ligne' => true, 'derniere_activite' => now()]);
        if ($wasOffline) {
            \App\Events\MiroirStatusChanged::dispatch($miroir->fresh());
        }
        return response()->json(['ok' => true]);
    });
    Route::post('offline', function (\Illuminate\Http\Request $request) {
        $miroir = $request->user();
        $miroir->update(['en_ligne' => false]);
        \App\Events\MiroirStatusChanged::dispatch($miroir->fresh());
        return response()->json(['ok' => true]);
    });
    Route::get('produits', [MiroirApi\ProduitController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| CRM (user token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    // Cross-boutique endpoints (no X-Boutique-Id required)
    Route::get('dashboard/stats', [Crm\DashboardController::class, 'stats']);
    Route::get('clientes/all', [Crm\ClienteController::class, 'indexAll']);
    Route::get('clientes/export/csv', [Crm\ExportController::class, 'allClientesCsv']);
    Route::get('clientes/detail/{cliente}', [Crm\ClienteController::class, 'showAll']);
    Route::put('clientes/detail/{cliente}', [Crm\ClienteController::class, 'updateAll']);
    Route::get('clientes/detail/{cliente}/seances', [Crm\ClienteController::class, 'seancesAll']);
    Route::post('seances/test', [Crm\SeanceController::class, 'testSeance']);

    // Boutiques list — accessible à tous les users connectés
    Route::get('boutiques/list', function () {
        return response()->json(\App\Models\Boutique::orderBy('nom')->get(['id', 'nom']));
    });

    // Super-admin
    Route::middleware('role:super-admin')->group(function () {
        Route::apiResource('boutiques', Crm\BoutiqueController::class);
    });

    // Gérant
    Route::middleware('role:gerant')->group(function () {
        Route::post('clientes', [Crm\ClienteController::class, 'store']);
        Route::put('clientes/{cliente}', [Crm\ClienteController::class, 'update']);
        Route::delete('clientes/{cliente}', [Crm\ClienteController::class, 'destroy']);

        Route::apiResource('miroirs', Crm\MiroirController::class);

        Route::get('config-miroir', [Crm\ConfigMiroirController::class, 'show']);
        Route::patch('config-miroir', [Crm\ConfigMiroirController::class, 'update']);

        Route::apiResource('medias', Crm\MediaController::class);
        Route::patch('medias/reorder', [Crm\MediaController::class, 'reorder']);

        Route::apiResource('produits', Crm\ProduitController::class)->except(['index']);
        Route::post('produits/sync-shopify', [Crm\ProduitController::class, 'syncShopify']);

        Route::apiResource('users', Crm\UserController::class)->only(['index', 'update', 'destroy']);

        Route::post('export/shopify', [Crm\ExportController::class, 'shopify']);
        Route::get('export/csv', [Crm\ExportController::class, 'csv']);

        // RGPD — gérant only
        Route::patch('consentements/{consentement}/revoquer', [Crm\ConsentementController::class, 'revoquer']);
        Route::get('clientes/detail/{cliente}/export-rgpd', [Crm\RgpdController::class, 'exportPersonalData']);
        Route::post('clientes/detail/{cliente}/anonymiser', [Crm\RgpdController::class, 'anonymiser']);
    });

    // Gérant + Collaborateur (lecture)
    Route::middleware('role:gerant,collaborateur')->group(function () {
        Route::get('clientes', [Crm\ClienteController::class, 'index']);
        Route::get('clientes/{cliente}', [Crm\ClienteController::class, 'show']);
        Route::get('clientes/{cliente}/seances', [Crm\ClienteController::class, 'seances']);
        Route::get('clientes/detail/{cliente}/consentements', [Crm\ConsentementController::class, 'index']);
        Route::get('seances', [Crm\SeanceController::class, 'index']);
        Route::get('seances/{seance}', [Crm\SeanceController::class, 'show']);
        Route::post('seances/{seance}/trigger-n8n', [Crm\SeanceController::class, 'triggerN8n']);
        Route::patch('photos/{photo}/diagnostic', [Crm\PhotoController::class, 'updateDiagnostic']);
        Route::get('produits', [Crm\ProduitController::class, 'index']);
    });
});

/*
|--------------------------------------------------------------------------
| N8N (static token)
|--------------------------------------------------------------------------
*/
Route::prefix('n8n')->middleware('n8n.token')->group(function () {
    Route::get('seances/{seance}/bilan', [N8n\SeanceController::class, 'bilan']);
    Route::patch('seances/{seance}/rapport', [N8n\SeanceController::class, 'rapport']);
    Route::get('seances/non-scannees', [N8n\SeanceController::class, 'nonScannees']);
    Route::patch('seances/{seance}/email-envoye', [N8n\SeanceController::class, 'emailEnvoye']);
    Route::get('photos/a-supprimer', [N8n\PhotoController::class, 'aSupprimer']);
    Route::delete('photos/{photo}/serveur', [N8n\PhotoController::class, 'supprimerServeur']);
});
