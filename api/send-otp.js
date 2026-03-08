import { Resend } from 'resend';

// Vercel leerá la llave desde sus variables de entorno automáticamente
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Solo permitimos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Extraemos el email y el código que nos manda el frontend
  const { email, codigo } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'STEAM Vocations <onboarding@resend.dev>',
      to: [email],
      subject: 'Tu Código de Verificación STEAM',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>¡Hola, futuro talento STEAM! 🚀</h2>
          <p>Tu código de verificación seguro es:</p>
          <h1 style="color: #07B1C9; letter-spacing: 5px; font-size: 32px;">${codigo}</h1>
          <p style="color: #7F8C8D;">Ingrésalo en la aplicación para continuar.</p>
        </div>
      `
    });

    // Si todo sale bien, respondemos con éxito
    return res.status(200).json(data);
  } catch (error) {
    // Si falla, devolvemos el error
    return res.status(500).json({ error: error.message });
  }
}