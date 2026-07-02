<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $avatar_path
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'phone', 'avatar_path', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function avatarUrl(): ?string
    {
        if ($this->avatar_path) {
            return asset('storage/'.$this->avatar_path);
        }

        // Fallback to the bundled default avatar at /public/resources/.
        return asset('resources/admin-default.png');
    }

    /**
     * ISO 3166-1 alpha-2 country code inferred from the leading dial code
     * on the stored E.164 phone number (e.g. "+591…" → "bo"). Returns null
     * when the number is missing or doesn't match a known dial code.
     *
     * Hand-curated table of the dial codes we actually serve — small
     * enough to keep self-contained, big enough to cover every country the
     * admin UI exposes as preferred in intl-tel-input.
     */
    public function phoneCountryCode(): ?string
    {
        if (! $this->phone || ! str_starts_with($this->phone, '+')) {
            return null;
        }

        $dialToIso = [
            '591' => 'bo', '54' => 'ar', '55' => 'br', '56' => 'cl', '51' => 'pe',
            '57' => 'co', '593' => 'ec', '595' => 'py', '598' => 'uy', '506' => 'cr',
            '507' => 'pa', '58' => 've', '52' => 'mx', '34' => 'es', '1' => 'us',
            '44' => 'gb', '49' => 'de', '33' => 'fr', '39' => 'it', '351' => 'pt',
            '86' => 'cn', '81' => 'jp', '82' => 'kr', '91' => 'in', '7' => 'ru',
        ];

        // Try longest codes first so e.g. "1" doesn't shadow nothing but
        // "591" is matched before "59".
        $digits = ltrim($this->phone, '+');
        foreach (['593', '595', '598', '506', '507', '591', '54', '55', '56', '57', '58', '52', '34', '44', '49', '33', '39', '86', '81', '82', '91', '51', '59'] as $code) {
            if (str_starts_with($digits, $code)) {
                return $dialToIso[$code] ?? null;
            }
        }
        if (str_starts_with($digits, '1')) {
            return 'us';
        }
        if (str_starts_with($digits, '7')) {
            return 'ru';
        }

        return null;
    }

    /** Phone digits without the country dial code, suitable for display. */
    public function phoneNational(): ?string
    {
        if (! $this->phone) {
            return null;
        }

        $iso = $this->phoneCountryCode();
        $dial = $iso ? array_search($iso, [
            'bo' => '591', 'ar' => '54', 'br' => '55', 'cl' => '56', 'pe' => '51',
            'co' => '57', 'ec' => '593', 'py' => '595', 'uy' => '598', 'cr' => '506',
            'pa' => '507', 've' => '58', 'mx' => '52', 'es' => '34', 'us' => '1',
            'gb' => '44', 'de' => '49', 'fr' => '33', 'it' => '39', 'pt' => '351',
            'cn' => '86', 'jp' => '81', 'kr' => '82', 'in' => '91', 'ru' => '7',
        ], true) : null;

        if ($dial === null) {
            return $this->phone;
        }

        return substr(ltrim($this->phone, '+'), strlen((string) $dial)) ?: null;
    }
}
