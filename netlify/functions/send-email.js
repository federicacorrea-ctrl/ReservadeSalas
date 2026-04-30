exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { title, date, startTime, endTime, allDay, description, color, meetLink, recipients } = body;

  if (!title || !date || !recipients || !recipients.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const timeInfo = allDay ? 'Todo el día' : `${startTime}${endTime ? ' – ' + endTime : ''}`;
  const colorMap = {
    humand: '#496be3', green: '#28c040', red: '#d42e2e',
    yellow: '#de920c', purple: '#6330f7', teal: '#267b6c',
    sky: '#46badd', flamingo: '#da3c1c'
  };
  const accentColor = colorMap[color] || '#496be3';

  const htmlBody = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f5f6f8;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:${accentColor};padding:24px 28px;">
        <p style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Nuevo evento en Humand</p>
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;line-height:1.3;">${title}</h1>
      </div>
      <div style="padding:24px 28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eeeef1;width:36px;vertical-align:top;">
              <span style="font-size:18px;">📅</span>
            </td>
            <td style="padding:10px 0 10px 10px;border-bottom:1px solid #eeeef1;vertical-align:top;">
              <p style="margin:0;font-size:13px;color:#8d8c9f;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Fecha</p>
              <p style="margin:4px 0 0;font-size:15px;color:#303036;font-weight:600;">${date}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:${description ? '1px solid #eeeef1' : 'none'};width:36px;vertical-align:top;">
              <span style="font-size:18px;">🕐</span>
            </td>
            <td style="padding:10px 0 10px 10px;border-bottom:${description ? '1px solid #eeeef1' : 'none'};vertical-align:top;">
              <p style="margin:0;font-size:13px;color:#8d8c9f;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Horario</p>
              <p style="margin:4px 0 0;font-size:15px;color:#303036;font-weight:600;">${timeInfo}</p>
            </td>
          </tr>
          ${description ? `
          <tr>
            <td style="padding:10px 0;width:36px;vertical-align:top;">
              <span style="font-size:18px;">📝</span>
            </td>
            <td style="padding:10px 0 10px 10px;vertical-align:top;">
              <p style="margin:0;font-size:13px;color:#8d8c9f;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Descripción</p>
              <p style="margin:4px 0 0;font-size:15px;color:#303036;">${description}</p>
            </td>
          </tr>` : ''}
        </table>
      </div>
      ${meetLink ? `
      <div style="padding:0 28px 24px;">
        <a href="${meetLink}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#496be3;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">
          <span style="font-size:18px;">📹</span> Unirse a la videollamada
        </a>
      </div>` : ''}
      <div style="background:#f5f6f8;padding:16px 28px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaaaba;">Enviado desde el Calendario Humand</p>
      </div>
    </div>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Calendario Humand <onboarding@resend.dev>',
        to: recipients,
        subject: `📅 Nuevo evento: ${title} — ${date}`,
        html: htmlBody
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Resend error');

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
