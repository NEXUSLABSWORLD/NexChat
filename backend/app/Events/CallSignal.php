<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallSignal implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $channelName,
        public int $senderUserId,
        public string $callId,
        public string $callType,
        public string $action,
        public ?int $targetUserId,
        public array $payload = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel($this->channelName)];
    }

    public function broadcastAs(): string
    {
        return 'call.signal';
    }

    public function broadcastWith(): array
    {
        return [
            'sender_user_id' => $this->senderUserId,
            'call_id' => $this->callId,
            'call_type' => $this->callType,
            'action' => $this->action,
            'target_user_id' => $this->targetUserId,
            'payload' => $this->payload,
        ];
    }
}
