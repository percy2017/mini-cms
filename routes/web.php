<?php

use App\Http\Controllers\Admin\AiImageController;
use App\Http\Controllers\Admin\ChatController;
use App\Http\Controllers\Admin\ChatSettingsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\StorageController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Public\AuthController;
use App\Http\Controllers\Public\ChatWidgetController;
use App\Models\ChatSetting;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $settings = ChatSetting::current();

    return inertia('landing', [
        'chatSettings' => [
            'chat_enabled' => $settings->chat_enabled,
            'position' => $settings->position,
            'welcome_message' => $settings->welcome_message,
            'offline_message' => $settings->offline_message,
            'online' => $settings->isOnline(),
        ],
    ]);
})->name('home');

Route::prefix('api/chat')->name('api.chat.')->group(function () {
    Route::post('/init', [ChatWidgetController::class, 'init'])->name('init');
    Route::post('/{uuid}/send', [ChatWidgetController::class, 'send'])->name('send');
    Route::get('/{uuid}/poll', [ChatWidgetController::class, 'poll'])->name('poll');
});

Route::prefix('api/auth')->name('api.auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('email/verify', function () {
        return inertia('auth/verify-email');
    })->name('verification.notice');

    Route::get('email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
        $request->fulfill();

        return redirect()->route('admin')->with('success', 'Correo verificado.');
    })->name('verification.verify');

    Route::post('email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();

        return back()->with('success', 'Enlace de verificación reenviado.');
    })->middleware('throttle:6,1')->name('verification.send');

    Route::get('admin', [DashboardController::class, 'index'])->name('admin');
    Route::get('admin/socket-stats', [DashboardController::class, 'socketStats'])->name('admin.socket-stats');

    Route::post('admin/storage/link', [StorageController::class, 'link'])
        ->name('admin.storage.link');

    Route::prefix('admin/media')->name('admin.media.')->group(function () {
        Route::get('/', [MediaController::class, 'index'])->name('index');
        Route::post('/', [MediaController::class, 'store'])->name('store');
        Route::get('/{media}', [MediaController::class, 'show'])->name('show');
        Route::patch('/{media}', [MediaController::class, 'update'])->name('update');
        Route::delete('/{media}', [MediaController::class, 'destroy'])->name('destroy');

        Route::post('generate', [AiImageController::class, 'generate'])
            ->middleware('throttle:10,1')
            ->name('generate');
    });

    Route::prefix('admin/users')->name('admin.users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/create', [UserController::class, 'create'])->name('create');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [UserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/roles')->name('admin.roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::get('/{role}/permissions', [RoleController::class, 'permissions'])->name('permissions');
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::put('/{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/chat')->name('admin.chat.')->group(function () {
        Route::get('/', [ChatController::class, 'index'])->name('index');
        Route::get('/settings', [ChatSettingsController::class, 'index'])->name('settings');
        Route::patch('/settings', [ChatSettingsController::class, 'update'])->name('settings.update');
        Route::get('/{conversation}', [ChatController::class, 'show'])->name('show');
        Route::get('/{conversation}/messages', [ChatController::class, 'messages'])->name('messages');
        Route::post('/{conversation}/send', [ChatController::class, 'send'])->name('send');
        Route::delete('/{conversation}', [ChatController::class, 'destroy'])->name('destroy');
        Route::get('/{conversation}/poll', [ChatController::class, 'pollMessages'])->name('poll');
    });

});

require __DIR__.'/settings.php';
