const nodemailer = require("nodemailer");
const Article = require("../models/Article");
const User = require("../models/User");

async function sendNewsletter() {
  try {
    console.log("Starting newsletter send process...");

    // Fetch top 10 headlines from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const topHeadlines = await Article.find({
      publishedAt: { $gte: yesterday },
    })
      .sort({ publishedAt: -1 })
      .limit(10);

    // Fetch subscribed users
    const subscribedUsers = await User.find({ newsletterSubscription: true });
    if (subscribedUsers.length === 0) {
      console.log("No subscribed users found. Skipping newsletter.");
      return;
    }

    // Group users by their preferred newsletter time
    const usersByTime = {};
    subscribedUsers.forEach((user) => {
      const time = user.newsletterTime || "08:00";
      if (!usersByTime[time]) {
        usersByTime[time] = [];
      }
      usersByTime[time].push(user);
    });

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Send newsletters only to users whose time matches current time
    const usersToSend = usersByTime[currentTime] || [];
    if (usersToSend.length === 0) {
      console.log(
        `No users scheduled for ${currentTime}. Skipping newsletter.`
      );
      return;
    }

    if (topHeadlines.length === 0) {
      console.log(
        "No recent headlines found. Sending notification email instead."
      );
      // Send a notification email that no headlines were found
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .notification { margin-bottom: 20px; }
              .notification h1 { color: #333; }
              .notification p { color: #666; }
            </style>
          </head>
          <body>
            <div class="notification">
              <h1>News Pulse Daily Digest</h1>
              <p>We apologize, but no recent headlines were found for today's newsletter.</p>
              <p>This might be due to a temporary issue with our news sources. We'll try again tomorrow!</p>
              <p>Stay informed with News Pulse!</p>
            </div>
          </body>
        </html>
      `;

      // Set up email transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Send notification emails to all subscribed users at their preferred time
      for (const user of usersToSend) {
        try {
          await transporter.sendMail({
            from: `"News Pulse" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "News Pulse Daily Digest - No Headlines Today",
            html: htmlContent,
          });
          console.log(`Notification sent to ${user.email} at ${currentTime}`);
        } catch (error) {
          console.error(`Failed to send notification to ${user.email}:`, error);
        }
      }

      console.log(
        `Notification sent to ${usersToSend.length} users at ${currentTime}.`
      );
      return;
    }

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Compile HTML email content
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .headline { margin-bottom: 20px; }
            .headline h2 { margin: 0; color: #333; }
            .headline p { color: #666; }
            .headline a { color: #007bff; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>News Pulse Daily Digest</h1>
          <p>Here are the top headlines from the last 24 hours:</p>
          ${topHeadlines
            .map(
              (article) => `
            <div class="headline">
              <h2>${article.title}</h2>
              <p>${article.description || "No description available."}</p>
              <a href="${article.url}">Read more</a>
            </div>
          `
            )
            .join("")}
          <p>Stay informed with News Pulse!</p>
        </body>
      </html>
    `;

    // Send emails to users scheduled for current time
    for (const user of usersToSend) {
      try {
        await transporter.sendMail({
          from: `"News Pulse" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Your Daily News Digest - News Pulse",
          html: htmlContent,
        });
        console.log(`Newsletter sent to ${user.email} at ${currentTime}`);
      } catch (error) {
        console.error(`Failed to send newsletter to ${user.email}:`, error);
      }
    }

    console.log(
      `Newsletter sent to ${usersToSend.length} users at ${currentTime}.`
    );
  } catch (error) {
    console.error("Error sending newsletter:", error);
  }
}

module.exports = sendNewsletter;
