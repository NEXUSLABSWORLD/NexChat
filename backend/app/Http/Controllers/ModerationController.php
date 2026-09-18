<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class ModerationController extends Controller
{
    // Contacts
    public function getContacts(Request $request)
    {
        $contacts = DB::table('user_contacts')
            ->where('user_id', $request->user()->id)
            ->pluck('contact_id');
        
        return response()->json($contacts);
    }

    public function toggleContact(Request $request)
    {
        $request->validate(['contact_id' => 'required|exists:users,id']);
        
        $userId = $request->user()->id;
        $contactId = $request->contact_id;

        $exists = DB::table('user_contacts')
            ->where('user_id', $userId)
            ->where('contact_id', $contactId)
            ->first();

        if ($exists) {
            DB::table('user_contacts')
                ->where('user_id', $userId)
                ->where('contact_id', $contactId)
                ->delete();
            return response()->json(['status' => 'removed', 'contact_id' => $contactId]);
        } else {
            DB::table('user_contacts')->insert([
                'user_id' => $userId,
                'contact_id' => $contactId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['status' => 'added', 'contact_id' => $contactId]);
        }
    }

    public function addContactByEmail(Request $request)
    {
        $request->merge(['email' => trim((string) $request->input('email'))]);
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $user = $request->user();
        $contact = User::whereRaw('LOWER(email) = ?', [strtolower($validated['email'])])->first();

        if (!$contact) {
            return response()->json([
                'message' => 'Aucun utilisateur ne correspond à cette adresse e-mail.',
            ], 404);
        }

        if ($contact->id === $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas vous ajouter vous-même.',
            ], 422);
        }

        $wasAdded = !DB::table('user_contacts')
            ->where('user_id', $user->id)
            ->where('contact_id', $contact->id)
            ->exists();

        if ($wasAdded) {
            DB::table('user_contacts')->insert([
                'user_id' => $user->id,
                'contact_id' => $contact->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'status' => $wasAdded ? 'added' : 'already_added',
            'contact' => $contact->only(['id', 'username', 'email', 'primary_language_code', 'is_online']),
        ], $wasAdded ? 201 : 200);
    }

    // Blocks
    public function getBlockedUsers(Request $request)
    {
        $blocks = DB::table('user_blocks')
            ->where('blocker_id', $request->user()->id)
            ->pluck('blocked_id');
        
        return response()->json($blocks);
    }

    public function toggleBlock(Request $request)
    {
        $request->validate(['blocked_id' => 'required|exists:users,id']);
        
        $blockerId = $request->user()->id;
        $blockedId = $request->blocked_id;

        $exists = DB::table('user_blocks')
            ->where('blocker_id', $blockerId)
            ->where('blocked_id', $blockedId)
            ->first();

        if ($exists) {
            DB::table('user_blocks')
                ->where('blocker_id', $blockerId)
                ->where('blocked_id', $blockedId)
                ->delete();
            return response()->json(['status' => 'unblocked', 'blocked_id' => $blockedId]);
        } else {
            DB::table('user_blocks')->insert([
                'blocker_id' => $blockerId,
                'blocked_id' => $blockedId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['status' => 'blocked', 'blocked_id' => $blockedId]);
        }
    }

    // Reports
    public function reportUser(Request $request)
    {
        $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        DB::table('user_reports')->insert([
            'reporter_id' => $request->user()->id,
            'reported_user_id' => $request->reported_user_id,
            'reason' => $request->reason,
            'description' => $request->description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['status' => 'reported']);
    }
}
