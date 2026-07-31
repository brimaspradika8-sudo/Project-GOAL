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

        return response()->json([
            'data' => $notifications->items(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'total' => $notifications->total(),
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $this->notifications->markAsRead($request->user(), $id);

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notifications->markAllAsRead($request->user());

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
            'marked' => $count,
            'unread_count' => 0,
        ]);
    }
}
