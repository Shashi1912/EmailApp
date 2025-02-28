const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const { parseString } = require("xml2js");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: "*", // Allow all origins (change this in production)
    methods: ["GET", "POST"],
}));

// 📌 Serve frontend files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// 📌 Function to load email configuration
const loadEmailConfig = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "config.xml"), "utf-8", (err, data) => {
            if (err) {
                console.error("❌ Failed to load config.xml:", err);
                reject(err);
                return;
            }
            parseString(data, (err, result) => {
                if (err) {
                    console.error("❌ XML Parsing Error:", err);
                    reject(err);
                    return;
                }
                console.log("✅ Config loaded successfully.");
                resolve(result.EmailConfig);
            });
        });
    });
};

// 📌 Email sending endpoint
app.post("/send-email", async (req, res) => {
    const { recipientEmail } = req.body;
    
    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: "❌ Recipient email is required!" });
    }

    try {
        // Load config dynamically
        const emailConfig = await loadEmailConfig();

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailConfig.Sender[0].Email[0],
                pass: emailConfig.Sender[0].Password[0],
            },
        });

        let mailOptions = {
            from: emailConfig.Sender[0].Email[0],
            to: recipientEmail,
            subject: emailConfig.EmailContent[0].Subject[0],
            text: emailConfig.EmailContent[0].Body[0],
            attachments: emailConfig.Attachment ? [
                { path: emailConfig.Attachment[0].ResumePath[0] }
            ] : [],
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully: ${info.response}`);
        res.json({ success: true, message: "✅ Email sent successfully!" });

    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ success: false, message: "❌ Failed to send email. Check server logs." });
    }
});

// 📌 Default route (for health check)
app.get("/", (req, res) => {
    res.send("✅ Server is running...");
});

// 📌 Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
