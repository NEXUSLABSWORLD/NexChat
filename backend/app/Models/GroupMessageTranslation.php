<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupMessageTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_message_id',
        'language_code',
        'translated_content',
    ];

    public function message()
    {
        return $this->belongsTo(GroupMessage::class, 'group_message_id');
    }
}
