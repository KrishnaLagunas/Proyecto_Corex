const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Servicio centralizado para el envío de correos electrónicos
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    this.from = `"Sistema COREX" <${process.env.GMAIL_USER}>`;
  }

  /**
   * Envía un correo electrónico genérico
   * @param {Object} options - Opciones del correo (to, subject, html, text)
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || ''
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado: ${info.messageId} a ${options.to}`);
      return info;
    } catch (error) {
      logger.error('Error al enviar email:', error);
      // No lanzamos el error para evitar romper el flujo principal si el correo falla
      return null;
    }
  }

  /**
   * Notifica al ciudadano sobre la actualización del estado de su trámite
   * @param {Object} data - Datos del trámite y el usuario
   */
  async sendTramiteStatusUpdate(data) {
    const { email, nombreCiudadano, codigoTramite, tituloTramite, nuevoEstado, observaciones } = data;

    const subject = `Actualización de Trámite: ${codigoTramite} - ${nuevoEstado.toUpperCase()}`;
    
    // Mapeo de colores según estado
    const estadoColores = {
      'pendiente': '#ffc107',
      'en_proceso': '#0d6efd',
      'en_revision': '#6610f2',
      'aprobado': '#198754',
      'rechazado': '#dc3545',
      'finalizado': '#198754'
    };
    
    const colorEstado = estadoColores[nuevoEstado] || '#6c757d';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0;">Sistema COREX</h2>
          <p style="color: #6c757d; margin: 5px 0;">Gestión Municipal Inteligente</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h3 style="color: #333; margin-top: 0;">Hola, ${nombreCiudadano}</h3>
          <p style="color: #555; line-height: 1.6;">
            Te informamos que tu trámite ha sido actualizado por un funcionario municipal.
          </p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #1e3a8a; border-radius: 4px;">
            <p style="margin: 5px 0;"><strong>Código:</strong> ${codigoTramite}</p>
            <p style="margin: 5px 0;"><strong>Título:</strong> ${tituloTramite}</p>
            <p style="margin: 15px 0;"><strong>Nuevo Estado:</strong> 
              <span style="display: inline-block; padding: 5px 12px; background-color: ${colorEstado}; color: #ffffff; border-radius: 20px; font-weight: bold; font-size: 0.9em; text-transform: uppercase;">
                ${nuevoEstado}
              </span>
            </p>
          </div>
          
          ${observaciones ? `
            <div style="margin-top: 15px;">
              <h4 style="color: #333; margin-bottom: 10px;">Observaciones del funcionario:</h4>
              <p style="color: #555; font-style: italic; background-color: #fff9db; padding: 10px; border-radius: 4px; border: 1px dashed #ffd43b;">
                "${observaciones}"
              </p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_BASE_URL || 'http://localhost:3000'}" style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">Ver mi Trámite</a>
          </div>
          
          <p style="color: #777; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
            Esta es una notificación automática del sistema COREX. Por favor, no respondas a este mensaje.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
          &copy; ${new Date().getFullYear()} COREX ERP. Todos los derechos reservados.
        </div>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Envía correo de recuperación de contraseña
   * @param {string} email 
   * @param {string} token 
   */
  async sendPasswordReset(email, token) {
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const subject = 'Recuperación de contraseña - COREX';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0;">COREX ERP</h2>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h3>Restablecimiento de Contraseña</h3>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/?resetToken=${encodeURIComponent(token)}" style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
          </div>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

module.exports = new EmailService();
