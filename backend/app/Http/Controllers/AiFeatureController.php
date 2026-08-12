<?php

namespace App\Http\Controllers;

use App\Models\AiSavedPhrase;
use App\Models\Message;
use App\Services\GenerativeAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AiFeatureController extends Controller
{
    protected $aiService;

    public function __construct(GenerativeAiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Rephrase text with a specific tone.
     */
    public function rephrase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:1000',
            'tone' => 'required|in:pro,friendly,natural',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $result = $this->aiService->rephrase($request->input('text'), $request->input('tone'));

        return response()->json(['data' => $result]);
    }

    /**
     * Chat with NexBot.
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $result = $this->aiService->chat($request->input('message'), $request->input('history') ?? []);
        
        return response()->json(['data' => $result]);
    }

    /**
     * Generate smart replies for the last received message.
     */
    public function smartReplies(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer|exists:conversations,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        $lastMessage = Message::where('conversation_id', $request->input('conversation_id'))
            ->where('sender_id', '!=', $user->id)
            ->latest('created_at')
            ->first();

        if (!$lastMessage) {
            return response()->json(['data' => []]);
        }

        $replies = $this->aiService->generateSmartReplies($lastMessage);

        return response()->json(['data' => $replies]);
    }

    /**
     * Get user's AI usage statistics.
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        // Find the top 3 most common target languages in messages received by the user
        // that were translated for them
        $topLanguages = Message::whereHas('conversation', function($q) use ($user) {
                $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
            })
            ->where('sender_id', '!=', $user->id)
            ->whereNotNull('content_translated')
            ->select('source_lang', DB::raw('count(*) as total'))
            ->groupBy('source_lang')
            ->orderByDesc('total')
            ->limit(3)
            ->pluck('source_lang');

        return response()->json([
            'data' => [
                'words_translated' => $user->ai_words_translated_count,
                'top_languages' => $topLanguages
            ]
        ]);
    }

    /**
     * List user's saved phrases.
     */
    public function getSavedPhrases(Request $request)
    {
        $phrases = $request->user()->aiSavedPhrases()->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $phrases]);
    }

    /**
     * Save a new phrase to the lexicon.
     */
    public function savePhrase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'original_text' => 'required|string',
            'translated_text' => 'nullable|string',
            'source_lang' => 'nullable|string|max:10',
            'target_lang' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $phrase = $request->user()->aiSavedPhrases()->create($request->all());

        return response()->json(['message' => 'Phrase saved', 'data' => $phrase], 201);
    }
    
    /**
     * Delete a saved phrase.
     */
    public function deletePhrase(Request $request, $id)
    {
        $phrase = $request->user()->aiSavedPhrases()->find($id);
        
        if (!$phrase) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $phrase->delete();
        
        return response()->json(['message' => 'Deleted successfully']);
    }
    
    /**
     * Update AI configuration (Proactive Translation, Formality).
     */
    public function updateConfig(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ai_proactive_translation' => 'boolean',
            'ai_translation_formality' => 'in:auto,formal,informal',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $request->user()->update($request->only(['ai_proactive_translation', 'ai_translation_formality']));

        return response()->json(['message' => 'Configuration updated', 'data' => $request->user()]);
    }
}
