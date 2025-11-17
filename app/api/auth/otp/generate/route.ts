import { NextRequest } from 'next/server';
import { generateOtpSchema } from '@/app/lib/validations/auth.schema';
import { OtpService } from '@/app/lib/services/otp.service';
import { successResponse, handleApiError } from '@/app/lib/utils/response';

/**
 * POST /api/auth/otp/generate
 * Genera y envía un OTP por email
 *
 * @body { email: string }
 * @returns { success: boolean, expiresAt: Date }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const validatedData = generateOtpSchema.parse(body);

    // Obtener metadata de la request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generar y enviar OTP
    const result = await OtpService.generateAndSend({
      email: validatedData.email,
      purpose: 'login',
      ipAddress,
      userAgent,
      expiresInMinutes: 10,
    });

    return successResponse(
      {
        message: 'Código OTP enviado exitosamente',
        expiresAt: result.expiresAt.toISOString(),
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
