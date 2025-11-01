const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// POST /api/newsletter/subscribe - Subscribe/unsubscribe to newsletter (requires auth)
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscribe, time } = req.body; // boolean: true to subscribe, false to unsubscribe, time: 'HH:MM'
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.newsletterSubscription = subscribe;
    if (time) {
      // Normalize time to HH:MM format with leading zeros
      const parts = time.split(":");
      const hours = parts[0] || "08";
      const minutes = parts[1] || "00";
      user.newsletterTime = `${hours.padStart(2, "0")}:${minutes.padStart(
        2,
        "0"
      )}`;
    }
    await user.save();

    // Send confirmation email
    if (subscribe) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .welcome { margin-bottom: 20px; }
              .welcome h1 { color: #333; }
              .welcome p { color: #666; }
            </style>
          </head>
          <body>
            <div class="welcome">
              <h1>Welcome to News Pulse Daily Newsletter!</h1>
              <p>You have successfully subscribed to receive daily top headlines via email.</p>
              <p>You will receive your first newsletter tomorrow at ${user.newsletterTime} with the latest news.</p>
              <p>Stay informed with News Pulse!</p>
            </div>
          </body>
        </html>
      `;

      try {
        await transporter.sendMail({
          from: `"News Pulse" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Welcome to News Pulse Daily Newsletter",
          html: htmlContent,
        });
        console.log(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error(
          `Failed to send welcome email to ${user.email}:`,
          emailError
        );
        // Don't fail the subscription if email fails
      }
    }

    res.json({
      message: subscribe
        ? "Subscribed to newsletter successfully"
        : "Unsubscribed from newsletter successfully",
      newsletterSubscription: user.newsletterSubscription,
    });
  } catch (error) {
    console.error("Error updating newsletter subscription:", error);
    res
      .status(500)
      .json({ message: "Failed to update newsletter subscription" });
  }
});

// GET /api/newsletter/status - Get current subscription status (requires auth)
router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      newsletterSubscription: user.newsletterSubscription,
      newsletterTime: user.newsletterTime,
    });
  } catch (error) {
    console.error("Error fetching newsletter status:", error);
    res.status(500).json({ message: "Failed to fetch newsletter status" });
  }
});

module.exports = router;
