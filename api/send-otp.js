const { Resend } = require('resend');

// Vercel leerá la llave desde sus variables de entorno automáticamente
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
    // Configuración de CORS por si es necesario
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo permitimos peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Extraemos el email y el código que nos manda el frontend
    const { email, codigo } = req.body;

    if (!email || !codigo) {
        return res.status(400).json({ error: 'Email y código son obligatorios' });
    }

    try {
        // ⚠️ ATENCIÓN: Como usas Resend gratis sin dominio propio verificado,
        // SOLO puedes enviar correos a la cuenta con la que te registraste en Resend.
        // Si intentas enviar a un correo de un tercero, Resend arroja un Error 403.
        // Para que NUNCA ruede tu app en pruebas, forzamos tu correo permitido aquí
        // o puedes descomentar e intentar enviar al 'email' real si compraras un dominio.
        const destinationEmail = 'vocaciones.steam0@gmail.com';

        const { data, error } = await resend.emails.send({
            from: 'STEAM Vocations <onboarding@resend.dev>', // Este es el dominio de prueba de resend
            to: [destinationEmail],
            subject: 'Tu Código de Verificación STEAM',
            html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>¡Hola, futuro talento STEAM! 🚀</h2>
          <p>Tu código de verificación seguro es:</p>
          <h1 style="color: #07B1C9; letter-spacing: 5px; font-size: 32px;">${codigo}</h1>
          <p style="color: #7F8C8D;">Ingrésalo en la aplicación para continuar.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
          <small style="color: #aaa;">Solicitado por el usuario: ${email}</small>
        </div>
      `
        });

        if (error) {
            console.error("Resend API Error:", error);
            return res.status(400).json({ error: error.message });
        }

        // Si todo sale bien, respondemos con éxito
        return res.status(200).json(data);
    } catch (error) {
        // Si falla de manera inesperada (ej. sin api key)
        console.error("Unexpected Server Error:", error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}