<?php

namespace App\Events;

use App\Models\Miroir;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MiroirStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Miroir $miroir) {}

    public function broadcastOn(): array
    {
        return [new Channel('miroirs')];
    }

    public function broadcastAs(): string
    {
        return 'MiroirStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'id'                => $this->miroir->id,
            'en_ligne'          => $this->miroir->en_ligne,
            'derniere_activite' => $this->miroir->derniere_activite?->toISOString(),
        ];
    }
}
