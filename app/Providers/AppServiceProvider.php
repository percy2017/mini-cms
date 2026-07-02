<?php

namespace App\Providers;

use App\Broadcasting\GuestBroadcaster;
use App\Http\Controllers\BroadcastAuthController;
use Carbon\CarbonImmutable;
use Illuminate\Broadcasting\BroadcastController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Swap the framework's BroadcastController for our guest-friendly one.
        // The auto-registered `/broadcasting/auth` route references the class
        // literally, so we alias here so the framework's instantiation
        // resolves to our subclass.
        if (! class_exists(BroadcastController::class, false)) {
            class_alias(
                BroadcastAuthController::class,
                BroadcastController::class,
            );
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureBroadcasting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Chat broadcasts are intentionally public: authorisation lives in
     * controllers (POST /messages, GET /messages), not at the channel layer.
     * Provide a GuestBroadcaster when nobody is logged in so PusherBroadcaster
     * doesn't blow up on `method_exists(null, ...)`.
     */
    protected function configureBroadcasting(): void
    {
        Broadcast::resolveAuthenticatedUserUsing(function () {
            return auth()->user() ?? new GuestBroadcaster;
        });
    }
}
