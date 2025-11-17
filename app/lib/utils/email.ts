/**
 * Email Service Utility
 * - Abstracción para envío de emails
 * - Soporta múltiples proveedores (Resend, SendGrid, etc.)
 * - Templates profesionales
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

/**
 * Resend Email Provider
 * - Proveedor recomendado para Next.js
 * - API simple y confiable
 */
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(options: EmailOptions): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }
  }
}

/**
 * SendGrid Email Provider (alternativa)
 */
class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(options: EmailOptions): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
        }],
        from: { email: options.from || this.fromEmail },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text,
          }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }
  }
}

/**
 * Console Email Provider (para desarrollo)
 */
class ConsoleProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<void> {
    console.log('========== EMAIL SENT ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html);
    console.log('Text:', options.text || 'N/A');
    console.log('================================');
  }
}

/**
 * Email Service Singleton
 */
class EmailService {
  private provider: EmailProvider;

  constructor() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';

    switch (emailProvider) {
      case 'resend':
        this.provider = new ResendProvider(
          process.env.RESEND_API_KEY!,
          process.env.EMAIL_FROM!
        );
        break;
      case 'sendgrid':
        this.provider = new SendGridProvider(
          process.env.SENDGRID_API_KEY!,
          process.env.EMAIL_FROM!
        );
        break;
      default:
        this.provider = new ConsoleProvider();
    }
  }

  async send(options: EmailOptions): Promise<void> {
    return this.provider.send(options);
  }

  /**
   * Envía OTP por email con template profesional
   */
  async sendOtp(email: string, otp: string, expiresInMinutes: number = 10): Promise<void> {
    const html = this.getOtpTemplate(otp, expiresInMinutes);
    const text = `Tu código de verificación es: ${otp}\n\nEste código expira en ${expiresInMinutes} minutos.\n\nSi no solicitaste este código, ignora este email.`;

    await this.send({
      to: email,
      subject: `Código de verificación: ${otp}`,
      html,
      text,
    });
  }

  /**
   * Envía notificación de transacción
   */
  async sendTransactionNotification(
    email: string,
    transactionType: string,
    amount: number,
    currency: string,
    status: string
  ): Promise<void> {
    const html = this.getTransactionTemplate(transactionType, amount, currency, status);
    const text = `${transactionType} de ${currency} ${amount.toFixed(2)} - Estado: ${status}`;

    await this.send({
      to: email,
      subject: `Transacción ${transactionType} - ${status}`,
      html,
      text,
    });
  }

  /**
   * Template HTML para OTP
   */
  private getOtpTemplate(otp: string, expiresInMinutes: number): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Código de Verificación</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hola,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Tu código de verificación es:
              </p>

              <!-- OTP Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px 0;">
                Este código expira en <strong>${expiresInMinutes} minutos</strong>.
              </p>
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                Si no solicitaste este código, puedes ignorar este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para notificación de transacción
   */
  private getTransactionTemplate(
    type: string,
    amount: number,
    currency: string,
    status: string
  ): string {
    const statusColors: Record<string, string> = {
      succeeded: '#28a745',
      pending: '#ffc107',
      failed: '#dc3545',
      processing: '#17a2b8',
    };

    const statusColor = statusColors[status] || '#6c757d';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Transacción</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: capitalize;">
                ${type}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 10px 0;">Monto:</td>
                  <td style="color: #333333; font-size: 20px; font-weight: bold; text-align: right; padding: 10px 0;">
                    ${currency} ${amount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 10px 0;">Estado:</td>
                  <td style="text-align: right; padding: 10px 0;">
                    <span style="background-color: ${statusColor}; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                      ${status}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                Si tienes alguna pregunta, contacta a nuestro soporte.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
