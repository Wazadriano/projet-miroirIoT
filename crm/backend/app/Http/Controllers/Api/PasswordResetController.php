<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Always return success to avoid email enumeration
        if (!$user) {
            return response()->json(['message' => 'Si cette adresse existe, un email a été envoyé.']);
        }

        // Throttle: check if a token was created less than 60s ago
        $existing = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if ($existing && $existing->created_at && now()->diffInSeconds($existing->created_at) < 60) {
            return response()->json(['message' => 'Si cette adresse existe, un email a été envoyé.']);
        }

        // Generate token
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        Mail::raw(
            "Bonjour {$user->name},\n\n"
                . "Vous avez demandé à réinitialiser votre mot de passe.\n\n"
                . "Cliquez sur ce lien pour définir un nouveau mot de passe :\n"
                . $resetUrl . "\n\n"
                . "Ce lien expire dans 60 minutes.\n\n"
                . "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n"
                . "— K Beauty Cosmetics",
            function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Réinitialisation de votre mot de passe — K Beauty');
            }
        );

        return response()->json(['message' => 'Si cette adresse existe, un email a été envoyé.']);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Lien invalide ou expiré.'], 422);
        }

        // Check expiration (60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Lien expiré. Veuillez refaire une demande.'], 422);
        }

        if (!Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Lien invalide ou expiré.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Lien invalide ou expiré.'], 422);
        }

        $user->password = $request->password;
        $user->save();

        // Delete the used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}
