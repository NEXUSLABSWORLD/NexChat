<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSavedPhrase extends Model
{
    protected $fillable = [
        'user_id',
        'original_text',
        'translated_text',
        'source_lang',
        'target_lang',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
