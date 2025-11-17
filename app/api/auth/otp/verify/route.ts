import { NextRequest } from 'next/server';
import { verifyOtpSchema } from '@/app/lib/validations/auth.schema';
import { OtpService } from '@/app/lib/services/otp.service';
import { successResponse, handleApiError } from '@/app/lib/utils/response';

/**
 * POST /api/auth/otp/verify
 * Verifica un código OTP
 *
 * @body { email: string, otp: string }
 * @returns { success: boolean, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const validatedData = verifyOtpSchema.parse(body);

    // Obtener metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verificar OTP
    const result = await OtpService.verify({
      email: validatedData.email,
      otp: validatedData.otp,
      purpose: 'login',
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        message: 'OTP verificado exitosamente',
        verified: result.success,
        userId: result.userId,
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
