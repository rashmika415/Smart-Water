const nodemailer = require("nodemailer");

async function sendHouseholdEstimate(userEmail, household) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use Gmail App Password
      }
    });

    // Ensure bill always shows 2 decimal places
    const formattedBill = Number(household.predictedBill || 0).toFixed(2);

    const mailOptions = {
      from: `"Smart Water Management 💧" <${process.env.EMAIL_USER}>`,
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

Thank you for using Smart Water  💙
Stay water-wise and save responsibly! 💧`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Household estimate email sent successfully to:", userEmail);

  } catch (error) {
    console.error("❌ Error sending household estimate email:", error.message);
  }
}

module.exports = { sendHouseholdEstimate };