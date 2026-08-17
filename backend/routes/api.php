<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Field\FieldAvailabilityController;
use App\Http\Controllers\Field\FieldController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Owner\FieldBookingConfigurationController;
use App\Http\Controllers\Owner\FieldScheduleController;
use App\Http\Controllers\Owner\OwnerRequestController;
use App\Http\Controllers\Owner\SuperAdminOwnerController;
use App\Http\Controllers\Profile\AvatarController;
use App\Http\Controllers\Profile\OnboardingController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

// Health Check (public — untuk monitoring & uptime checks)
Route::get('/health', [HealthController::class, 'check']);

Route::middleware('throttle:auth-sensitive')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/verify-token', [PasswordResetController::class, 'token']);
    Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);
});
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot']);
});
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/fields', [FieldController::class, 'index']);
    Route::get('/fields/{id}', [FieldController::class, 'show']);
    Route::get('/fields/{id}/availability', [FieldAvailabilityController::class, 'show']);
    Route::get('/lapangan/{id}/slots', [FieldAvailabilityController::class, 'show']);
    Route::get('/me/onboarding/check-username', [OnboardingController::class, 'checkUsername']);
});
// Protected (Sanctum + rate limit)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [ProfileController::class, 'me']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::put('/me/password', [ProfileController::class, 'updatePassword']);
    Route::post('/me/onboarding', [OnboardingController::class, 'submit']);
    Route::post('/me/avatar', [AvatarController::class, 'store']);
    // Image upload
    Route::post('/upload/image', [UploadController::class, 'image']);
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    // Owner upgrade request
    Route::post('/me/owner-request', [OwnerRequestController::class, 'store'])->middleware('throttle:5,1');
    Route::get('/me/owner-request', [OwnerRequestController::class, 'status']);
    // Fields - owner's own list (hanya owner & super_admin)
    // Di-move ke dalam group role:owner,super_admin di bawah
    // Fields - owner manages own fields
    Route::middleware('role:owner,super_admin')->group(function () {
        Route::get('/fields/my/list', [FieldController::class, 'myFields']);
        Route::post('/fields', [FieldController::class, 'store']);
        Route::put('/fields/{id}', [FieldController::class, 'update']);
        Route::delete('/fields/{id}', [FieldController::class, 'destroy']);
        Route::patch('/owner/fields/{id}/schedule', [FieldBookingConfigurationController::class, 'updateSchedule']);
        Route::post('/owner/fields/{id}/prices', [FieldBookingConfigurationController::class, 'storePrice']);
        Route::put('/owner/prices/{id}', [FieldBookingConfigurationController::class, 'updatePrice']);
        Route::delete('/owner/prices/{id}', [FieldBookingConfigurationController::class, 'destroyPrice']);
        Route::post('/owner/fields/{id}/images', [FieldController::class, 'storeImage'])->middleware('throttle:booking-sensitive');
        Route::patch('/owner/images/{imageId}/primary', [FieldController::class, 'setPrimaryImage']);
        Route::delete('/owner/images/{imageId}', [FieldController::class, 'destroyImage']);

        // Schedules, Holidays, and Blocked Slots management
        Route::get('/owner/fields/{id}/schedules', [FieldScheduleController::class, 'getSchedules']);
        Route::put('/owner/fields/{id}/schedules', [FieldScheduleController::class, 'updateSchedules']);
        Route::get('/owner/fields/{id}/holidays', [FieldScheduleController::class, 'getHolidays']);
        Route::post('/owner/fields/{id}/holidays', [FieldScheduleController::class, 'storeHoliday']);
        Route::delete('/owner/holidays/{id}', [FieldScheduleController::class, 'destroyHoliday']);
        Route::get('/owner/fields/{id}/blocked-slots', [FieldScheduleController::class, 'getBlockedSlots']);
        Route::post('/owner/fields/{id}/blocked-slots', [FieldScheduleController::class, 'storeBlockedSlot']);
        Route::delete('/owner/blocked-slots/{id}', [FieldScheduleController::class, 'destroyBlockedSlot']);
    });
    // Fields - super admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/fields/pending/list', [FieldController::class, 'pending']);
        Route::get('/fields/trashed/list', [FieldController::class, 'trashed']);
        Route::post('/fields/{id}/approve', [FieldController::class, 'approve']);
        Route::post('/fields/{id}/restore', [FieldController::class, 'restore']);
        Route::delete('/fields/{id}/force', [FieldController::class, 'forceDelete']);
        Route::post('/fields/bulk-approve', [FieldController::class, 'bulkApprove']);
        Route::post('/fields/bulk-delete', [FieldController::class, 'bulkDestroy']);
        Route::post('/fields/bulk-restore', [FieldController::class, 'bulkRestore']);
        Route::post('/fields/bulk-force', [FieldController::class, 'bulkForceDelete']);
    });
    // Owner requests - super_admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/owner-requests/pending', [SuperAdminOwnerController::class, 'pending']);
        Route::post('/owner-requests/{id}/review', [SuperAdminOwnerController::class, 'review']);
    });
    // Super admin - manage users
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/super-admin/users', [UserController::class, 'index']);
        Route::get('/super-admin/audit-logs', [UserController::class, 'auditLogs']);
        Route::post('/super-admin/users', [UserController::class, 'store']);
        Route::post('/super-admin/users/bulk-delete', [UserController::class, 'bulkDestroy']);
        Route::put('/super-admin/users/{id}', [UserController::class, 'update']);
        Route::put('/super-admin/users/{id}/role', [UserController::class, 'updateRole']);
        Route::delete('/super-admin/users/{id}', [UserController::class, 'destroy']);
    });
    // Bookings (Sprint 3) - player
    Route::middleware('role:player')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle:booking-sensitive');
        Route::post('/booking', [BookingController::class, 'store'])->middleware('throttle:booking-sensitive'); // alias untuk frontend compatibility
        Route::delete('/bookings/bulk', [BookingController::class, 'bulkDestroy']);
        Route::get('/bookings/my', [BookingController::class, 'myBookings']);
        Route::get('/bookings/history', [BookingController::class, 'history']);
        Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancel'])->middleware('throttle:booking-sensitive');
    });
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    // Bookings - owner / super admin
    Route::middleware('role:owner,super_admin')->group(function () {
        Route::get('/owner/bookings', [BookingController::class, 'ownerIndex']);
        Route::get('/owner/fields/{id}/bookings', [BookingController::class, 'ownerFieldBookings']);
        Route::patch('/owner/bookings/{id}/approve', [BookingController::class, 'approve'])->middleware('throttle:booking-sensitive');
        Route::patch('/owner/bookings/{id}/confirm-payment', [BookingController::class, 'confirmPayment'])->middleware('throttle:booking-sensitive');
        Route::patch('/owner/bookings/{id}/reject', [BookingController::class, 'reject'])->middleware('throttle:booking-sensitive');
        Route::patch('/owner/bookings/{id}/complete', [BookingController::class, 'complete'])->middleware('throttle:booking-sensitive');
    });
    // Bookings - super admin monitoring
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/admin/bookings', [BookingController::class, 'adminIndex']);
    });
});
