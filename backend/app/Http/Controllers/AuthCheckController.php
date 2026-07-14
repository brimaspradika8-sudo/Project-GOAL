<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthCheckController extends Controller
{
    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->input('email')));

        $exists = DB::connection('pgsql')
            ->table('auth.users')
            ->whereRaw('LOWER(email) = ?', [$email])
            ->exists();

        return response()->json(['exists' => $exists]);
    }
}
