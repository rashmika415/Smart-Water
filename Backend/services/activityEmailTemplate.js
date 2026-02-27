const getEmailTemplate = (title, message, details, type = 'info') => {
    const themes = {
        success: {
            primary: '#10b981', // Emerald
            headerGradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
            lightbg: '#ecfdf5',
            accent: '#059669'
        },
        warning: {
            primary: '#f59e0b', // Amber
            headerGradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
            lightbg: '#fffbeb',
            accent: '#d97706'
        },
        danger: {
            primary: '#ef4444', // Red
            headerGradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
            lightbg: '#fef2f2',
            accent: '#dc2626'
        },
        info: {
            primary: '#3b82f6', // blue
            headerGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
            lightbg: '#eff6ff',
            accent: '#2563eb'
        }
    };

    const theme = themes[type] || themes.info;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: ${theme.headerGradient};
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.025em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
          margin: 8px 0 0;
          opacity: 0.9;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .content {
          padding: 40px;
        }
        .title {
          color: #0f172a;
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 16px;
          letter-spacing: -0.025em;
        }
        .message {
          font-size: 16px;
          color: #475569;
          margin-bottom: 32px;
        }
        .details-container {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px;
        }
        .detail-row {
          display: table;
          width: 100%;
          border-bottom: 1px solid #f1f5f9;
          padding: 12px 16px;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label {
          display: table-cell;
          width: 140px;
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          vertical-align: top;
        }
        .value {
          display: table-cell;
          font-weight: 500;
          color: #1e293b;
          font-size: 15px;
          text-align: left;
          padding-left: 20px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }
        .system-tag {
          display: inline-block;
          margin-top: 12px;
          font-size: 10px;
          color: #cbd5e1;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .badge {
          background-color: ${theme.lightbg};
          color: ${theme.accent};
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>Smart Water System</p>
          <h1>Notification Center</h1>
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <p class="message">${message}</p>
          <div class="details-container">
            ${details.map(item => `
              <div class="detail-row">
                <span class="label">${item.label}</span>
                <span class="value">${item.label === 'Status' ? `<span class="badge">${item.value}</span>` : item.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Water Management. Authorized Personnel Only.</p>
          <span class="system-tag">Automated Dispatch System</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getEmailTemplate;
