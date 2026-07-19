<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - GOAL</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background-color:#4be277;padding:32px;text-align:center;">
                            <h1 style="color:#0e2a14;margin:0;font-size:28px;font-weight:800;">GOAL</h1>
                            <p style="color:#0e2a14;margin:8px 0 0;font-size:14px;">Reset Password</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 32px;">
                            <p style="color:#1a1a2e;font-size:16px;margin:0 0 16px;">Halo,</p>
                            <p style="color:#1a1a2e;font-size:16px;margin:0 0 16px;">Kami menerima permintaan untuk mengatur ulang password akun GOAL Anda.</p>
                            <p style="color:#1a1a2e;font-size:16px;margin:0 0 24px;">Klik tombol di bawah ini untuk melanjutkan:</p>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ config('app.frontend_url') ?? 'http://localhost:8081' }}/reset-password?token={{ $token }}&email={{ $email }}" style="display:inline-block;background-color:#4be277;color:#0e2a14;text-decoration:none;padding:14px 48px;border-radius:10px;font-size:16px;font-weight:700;">RESET PASSWORD</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#666;font-size:14px;margin:32px 0 0;">Atau gunakan kode verifikasi ini:</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:16px 0;">
                                        <span style="display:inline-block;background-color:#f0fdf4;color:#166534;padding:12px 32px;border-radius:8px;font-size:24px;font-weight:700;letter-spacing:8px;font-family:monospace;">{{ $token }}</span>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#999;font-size:13px;margin:24px 0 0;">Kode ini akan kedaluwarsa dalam 60 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8f9fa;padding:20px 32px;text-align:center;">
                            <p style="color:#999;font-size:12px;margin:0;">&copy; 2026 GOAL - Aplikasi Olahraga</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
