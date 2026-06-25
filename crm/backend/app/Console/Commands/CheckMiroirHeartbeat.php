<?php

namespace App\Console\Commands;

use App\Events\MiroirStatusChanged;
use App\Models\Miroir;
use Illuminate\Console\Command;

class CheckMiroirHeartbeat extends Command
{
    protected $signature   = 'miroirs:check-heartbeat';
    protected $description = 'Marque hors-ligne les miroirs sans heartbeat depuis 2 minutes';

    public function handle(): int
    {
        Miroir::query()
            ->where('en_ligne', true)
            ->where('derniere_activite', '<', now()->subMinutes(2))
            ->each(function (Miroir $miroir) {
                $miroir->update(['en_ligne' => false]);
                MiroirStatusChanged::dispatch($miroir->fresh());
                $this->line("Miroir {$miroir->nom} marqué hors-ligne");
            });

        return self::SUCCESS;
    }
}
