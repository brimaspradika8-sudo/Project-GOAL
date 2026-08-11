<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));

        $notifications = $this->notifications->listForUser($request->user(), $page);

        return $this->successResponse('Daftar notifikasi berhasil dimuat.', $notifications->items(), 200, [
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'total' => $notifications->total(),
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return $this->successResponse('Jumlah notifikasi belum dibaca berhasil dimuat.', [
            'count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $marked = $this->notifications->markAsRead($request->user(), $id);

        if (!$marked) {
            return $this->errorResponse('Notifikasi tidak ditemukan.', [], 404);
        }

        return $this->successResponse('Notifikasi ditandai sudah dibaca.', [
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notifications->markAllAsRead($request->user());

        return $this->successResponse('Semua notifikasi ditandai sudah dibaca.', [
            'marked' => $count,
            'unread_count' => 0,
        ]);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $deleted = $this->notifications->deleteAll($request->user());

        return $this->successResponse('Semua notifikasi dihapus.', [
            'deleted' => $deleted,
            'unread_count' => 0,
        ]);
    }
}
