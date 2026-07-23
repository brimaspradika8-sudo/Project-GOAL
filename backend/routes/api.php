<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Profile\OnboardingController;
use App\Http\Controllers\Field\FieldController;
use App\Http\Controllers\Owner\OwnerRequestController;
use App\Http\Controllers\Owner\AdminOwnerController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\UploadController;
    Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register',    [AuthController::class, 'register']);
    Route::post('/auth/login',       [AuthController::class, 'login']);
    Route::post('/auth/check-email', [AuthController::class, 'checkEmail']);
    Route::post('/auth/verify-token',[PasswordResetController::class, 'token']);
    Route::post('/auth/reset-password',[PasswordResetController::class, 'reset']);
});
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot']);
});
Route::get('/fields',                      [FieldController::class, 'index']);
Route::get('/fields/{id}',                 [FieldController::class, 'show']);
Route::get('/me/onboarding/check-username',[OnboardingController::class, 'checkUsername']);
// Protected (Sanctum + rate limit)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [ProfileController::class, 'me']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::put('/me/password', [ProfileController::class, 'updatePassword']);
    Route::post('/me/onboarding',[OnboardingController::class, 'submit']);
    // Image upload
    Route::post('/upload/image', [UploadController::class, 'image']);
    // Owner upgrade request
    Route::post('/me/owner-request',[OwnerRequestController::class, 'store']);
    Route::get('/me/owner-request', [OwnerRequestController::class, 'status']);
    // Fields - owner's own list
    Route::get('/fields/my/list', [FieldController::class, 'myFields']);
    // Fields - owner manages own fields
    Route::middleware('role:owner,admin,super_admin')->group(function () {
        Route::post('/fields',       [FieldController::class, 'store']);
        Route::put('/fields/{id}',   [FieldController::class, 'update']);
        Route::delete('/fields/{id}',[FieldController::class, 'destroy']);
    });
    // Fields - super admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/fields/pending/list', [FieldController::class, 'pending']);
        Route::get('/fields/trashed/list', [FieldController::class, 'trashed']);
        Route::post('/fields/{id}/approve',[FieldController::class, 'approve']);
        Route::post('/fields/{id}/restore',[FieldController::class, 'restore']);
        Route::delete('/fields/{id}/force',[FieldController::class, 'forceDelete']);
    });
    // Owner requests - admin+
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/owner-requests/pending',      [AdminOwnerController::class, 'pending']);
        Route::post('/owner-requests/{id}/review', [AdminOwnerController::class, 'review']);
    });
    // Admin - manage users (admin & super_admin)
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/admin/users',          [UserController::class, 'index']);
        Route::post('/admin/users',         [UserController::class, 'store']);
        Route::put('/admin/users/{id}',     [UserController::class, 'update']);
        Route::put('/admin/users/{id}/role',[UserController::class, 'updateRole']);
        Route::delete('/admin/users/{id}',  [UserController::class, 'destroy']);
    });
});