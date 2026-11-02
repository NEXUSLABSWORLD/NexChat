<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqTranscriptionService
{
    public function transcribe(string $audioUrl, string $fileName, ?string $language = null): ?string
    {
        $apiKey = config('services.groq.key');
        if (!$apiKey) {
            Log::warning('Groq transcription skipped: GROQ_API_KEY is not configured.');
            return null;
        }

        try {
            $audio = Http::timeout(20)->get($audioUrl);
            if (!$audio->successful()) {
                Log::warning('Groq transcription download failed.', ['status' => $audio->status()]);
                return null;
            }

            $request = Http::withToken($apiKey)
                ->timeout(60)
                ->attach('file', $audio->body(), $fileName ?: 'voice-message.webm');

            $response = $request->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                'model' => config('services.groq.model', 'whisper-large-v3-turbo'),
                'response_format' => 'json',
                ...($language ? ['language' => strtolower($language)] : []),
            ]);

            if (!$response->successful()) {
                Log::warning('Groq transcription failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $text = trim((string) $response->json('text', ''));
            return $text !== '' ? $text : null;
        } catch (\Throwable $exception) {
            Log::warning('Groq transcription exception.', ['message' => $exception->getMessage()]);
            return null;
        }
    }
}
