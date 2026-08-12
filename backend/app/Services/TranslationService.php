<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranslationService
{
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.deepl.key');
        $this->apiUrl = config('services.deepl.url') ?? 'https://api-free.deepl.com';
        
        // Auto-detect pro vs free URL if key is provided and url is default
        if ($this->apiKey && !config('services.deepl.url')) {
            if (!str_ends_with($this->apiKey, ':fx')) {
                $this->apiUrl = 'https://api.deepl.com';
            }
        }
    }

    /**
     * Translate text from source language to target language.
     * Falls back to MyMemory API if DeepL API Key is not configured.
     *
     * @param string $text
     * @param string $targetLang (e.g. 'fr', 'en', 'es')
     * @param string|null $sourceLang (optional, can be auto-detected by APIs)
     * @return array|null Returns ['text' => 'translated text', 'detected_source_lang' => 'fr'] or null on failure.
     */
    public function translate(string $text, string $targetLang, ?string $sourceLang = null): ?array
    {
        if (empty(trim($text))) {
            return [
                'text' => $text,
                'detected_source_lang' => $sourceLang ?? $targetLang
            ];
        }

        // If DeepL API Key is configured, use DeepL
        if ($this->apiKey) {
            return $this->translateViaDeepL($text, $targetLang, $sourceLang);
        }

        // Otherwise, fall back to MyMemory API
        return $this->translateViaMyMemory($text, $targetLang, $sourceLang);
    }

    /**
     * Translate text using DeepL API.
     */
    protected function translateViaDeepL(string $text, string $targetLang, ?string $sourceLang = null): ?array
    {
        // DeepL expects target_lang to be uppercase (e.g., 'EN', 'FR', 'ES').
        // Note: For EN and PT, DeepL supports distinctions like 'EN-US', 'EN-GB', 'PT-BR', 'PT-PT'.
        $target = strtoupper($targetLang);
        if ($target === 'EN') {
            $target = 'EN-US';
        }

        $params = [
            'text' => [$text],
            'target_lang' => $target,
        ];

        if ($sourceLang) {
            $params['source_lang'] = strtoupper($sourceLang);
        }

        try {
            $http = Http::withHeaders([
                'Authorization' => 'DeepL-Auth-Key ' . $this->apiKey,
            ])->timeout(5);
            if (app()->environment('local')) {
                $http = $http->withoutVerifying();
            }
            $response = $http->post($this->apiUrl . '/v2/translate', $params);

            if ($response->successful()) {
                $data = $response->json();
                $translation = $data['translations'][0] ?? null;
                if ($translation) {
                    return [
                        'text' => $translation['text'],
                        'detected_source_lang' => strtolower($translation['detected_source_lang'] ?? $sourceLang)
                    ];
                }
            } else {
                Log::error('DeepL translation API error: ' . $response->status() . ' - ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('DeepL translation exception: ' . $e->getMessage());
        }

        // Fallback to MyMemory if DeepL API call fails
        Log::warning('DeepL translation failed. Falling back to MyMemory API.');
        return $this->translateViaMyMemory($text, $targetLang, $sourceLang);
    }

    /**
     * Translate text using MyMemory API.
     */
    protected function translateViaMyMemory(string $text, string $targetLang, ?string $sourceLang = null): ?array
    {
        $source = $sourceLang ? strtolower($sourceLang) : 'auto';
        $target = strtolower($targetLang);

        $langpair = "{$source}|{$target}";

        try {
            $http = Http::timeout(5);
            if (app()->environment('local')) {
                $http = $http->withoutVerifying();
            }
            // Using a contact email to get higher quota (10k words/day)
            $response = $http->get('https://api.mymemory.translated.net/get', [
                'q' => $text,
                'langpair' => $langpair,
                'de' => 'dev@linguchat.com'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $translatedText = $data['responseData']['translatedText'] ?? null;
                if ($translatedText) {
                    // Extract detected source lang if it was 'auto'
                    $detectedSource = $sourceLang;
                    if (!$detectedSource && isset($data['matches'][0]['id'])) {
                        // MyMemory sometimes returns detected language inside matches or responseData
                        // We will fall back to sourceLang or the target if undetected
                    }
                    
                    return [
                        'text' => $translatedText,
                        'detected_source_lang' => $detectedSource ?? $source
                    ];
                }
            } else {
                Log::error('MyMemory translation API error: ' . $response->status() . ' - ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('MyMemory translation exception: ' . $e->getMessage());
        }

        return null;
    }
}
