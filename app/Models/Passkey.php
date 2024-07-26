<?php

namespace App\Models;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Passkey extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'credential_id', 'data'];

    protected function casts(): array {
        return [
            'data' => 'json'
        ];
    }


    public function scopeCredentialId(Builder $query, string $credentialId): Builder
    {
        return $query->where('credential_id', $credentialId);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
