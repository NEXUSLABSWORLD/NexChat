<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerativeAiService
{
    protected $apiKey;
    protected $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    /**
     * Send a prompt to the Gemini API.
     */
    protected function callGemini(string $prompt): ?string
    {
        if (!$this->apiKey) {
            Log::warning("GenerativeAiService: Gemini API key is missing. Returning a mocked response.");
            return null; // The caller should handle mock logic or throw an exception if strict
        }

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    return trim($data['candidates'][0]['content']['parts'][0]['text']);
                }
            }

            Log::error("Gemini API Error: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("GenerativeAiService Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Interactive Chat with NexBot.
     */
    public function chat(string $message, array $history = []): string
    {
        $prompt = "Tu es NexBot, l'assistant et coach linguistique officiel intégré à l'application de messagerie NexChat.\n";
        $prompt .= "TON RÔLE :\n";
        $prompt .= "1. Agir comme un compagnon de discussion et coach linguistique (en anglais, espagnol, etc.). Si l'utilisateur s'exprime dans une langue étrangère, réponds dans cette même langue de façon fluide et bienveillante, avec une petite note corrective si nécessaire.\n";
        $prompt .= "2. Aider à la rédaction et la perfection de messages (textes pro, e-mails, amitié) pour les discussions NexChat.\n";
        $prompt .= "3. Rester STRICTEMENT axé sur la communication, la linguistique et la rédaction. Ne fais pas de longues encyclopédies hors-sujet. Sois concis, chaleureux, dynamique et adapté au format de chat.\n\n";

        foreach ($history as $msg) {
            $role = ($msg['role'] ?? '') === 'user' ? 'Utilisateur' : 'NexBot';
            $content = $msg['content'] ?? '';
            $prompt .= "{$role}: {$content}\n";
        }
        $prompt .= "Utilisateur: {$message}\nNexBot:";

        $result = $this->callGemini($prompt);

        return $result ?: "Désolé, je rencontre un problème de connexion au moteur IA pour le moment.";
    }

    /**
     * Rephrase a draft message in a specific tone.
     */
    public function rephrase(string $text, string $tone = 'pro'): string
    {
        $prompt = "Voici un message : \"{$text}\"\n";
        
        if ($tone === 'pro') {
            $prompt .= "Reformule ce message pour le rendre plus professionnel, clair et poli. Ne renvoie que la reformulation sans autre texte d'introduction.";
        } elseif ($tone === 'friendly') {
            $prompt .= "Reformule ce message pour le rendre plus amical, chaleureux et décontracté. Ne renvoie que la reformulation sans autre texte.";
        } else {
            $prompt .= "Reformule ce message de manière naturelle. Ne renvoie que la reformulation sans autre texte.";
        }

        $result = $this->callGemini($prompt);

        if (!$result) {
            // Mock if no API key
            return $tone === 'pro' 
                ? "Version plus professionnelle de : " . $text
                : "Version amicale de : " . $text;
        }

        return $result;
    }

    /**
     * Generate smart replies based on the conversation context.
     */
    public function generateSmartReplies(Message $lastMessage): array
    {
        $prompt = "Tu es un assistant de chat. Voici le dernier message reçu dans une conversation : \"{$lastMessage->content_original}\". \n";
        $prompt .= "Génère exactement 3 suggestions de réponses courtes et pertinentes pour répondre à ce message. \n";
        $prompt .= "Sépare chaque suggestion par un saut de ligne. Ne rajoute aucun autre texte.";

        $result = $this->callGemini($prompt);

        if (!$result) {
            // Mock if no API key
            return [
                "C'est noté, merci !",
                "Je m'en occupe tout de suite.",
                "On en parle plus tard ?"
            ];
        }

        $lines = array_filter(array_map('trim', explode("\n", $result)));
        // Return exactly 3 suggestions, clean up any leading bullets or numbers
        $replies = [];
        foreach ($lines as $line) {
            $cleaned = preg_replace('/^(\d+\.|-|\*)\s*/', '', $line);
            if (!empty($cleaned)) {
                $replies[] = $cleaned;
            }
            if (count($replies) === 3) break;
        }

        return count($replies) === 3 ? $replies : [
                "C'est noté, merci !",
                "Je m'en occupe tout de suite.",
                "On en parle plus tard ?"
            ];
    }

    /**
     * Summarize a transcript.
     */
    public function summarizeTranscript(string $transcript, string $targetLang = 'fr'): string
    {
        $prompt = "Voici une transcription des derniers messages d'un groupe de discussion :\n\n";
        $prompt .= $transcript . "\n\n";
        $prompt .= "Rédige un résumé clair, concis et structuré de cette discussion en langue '{$targetLang}'. ";
        $prompt .= "Fais ressortir les points importants, les décisions prises et les questions ouvertes. ";
        $prompt .= "Ne renvoie que le résumé sans phrases d'introduction.";

        $result = $this->callGemini($prompt);

        if (!$result) {
            // Mock
            return "Résumé IA (Mock) :\n- L'équipe a abordé plusieurs points concernant le projet actuel.\n- Une décision a été prise pour avancer sur la prochaine phase.\n- Pensez à vérifier vos tâches respectives.";
        }

        return $result;
    }
}
