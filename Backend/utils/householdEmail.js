const nodemailer = require("nodemailer");

function buildTransport() {
  // Prefer SMTP_* (more explicit and already used elsewhere), fallback to EMAIL_* for backward compatibility.
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("Email credentials are missing (set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS)");
  }

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  // Legacy Gmail service mode fallback.
  return nodemailer.createTransport({
    service: "Gmail",
    auth: { user: smtpUser, pass: smtpPass },
  });
}

async function sendHouseholdEstimate(userEmail, household) {
  try {
    const transporter = buildTransport();

    // Ensure bill always shows 2 decimal places
    const formattedBill = Number(household.predictedBill || 0).toFixed(2);
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER;
    const fromName = process.env.FROM_NAME || "Smart Water Management";

    const recs = Array.isArray(household.billRecommendations) ? household.billRecommendations : [];
    const recBlock =
      recs.length > 0
        ? `\n\n✨ Personalized savings recommendations:\n${recs.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n`
        : "";

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject: "💧 Your Household Estimated Water Usage & Bill",
      text: `👋 Hello ${household.name},

💧 Here are your Estimated Monthly Water Details:

━━━━━━━━━━━━━━━━━━━━━━
🚿 Estimated Usage: ${household.estimatedMonthlyLiters} L
📦 Estimated Units: ${household.estimatedMonthlyUnits} m³
🌦️ Climate Zone: ${household.climateZone}
💰 Predicted Water Bill: Rs. ${formattedBill}
━━━━━━━━━━━━━━━━━━━━━━

📊 These values are calculated based on:
• Number of Residents
• Property Type
• Weather & Climate Zone
${recBlock}
Thank you for using Smart Water  💙
Stay water-wise and save responsibly! 💧`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Household estimate email sent successfully to:", userEmail);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("❌ Error sending household estimate email:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendHouseholdEstimate };