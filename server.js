const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const { parseString } = require("xml2js");
const path = require("path");

const app = express();
const PORT = 5000; 

app.use(express.json());
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Load email configuration from XML
const configPath = path.join(__dirname, "Config.xml");
let emailConfig = {};

const loadConfig = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(configPath, "utf-8", (err, data) => {
            if (err) {
                console.error("❌ Failed to load Config.xml:", err);
                return reject(err);
            }
            parseString(data, (err, result) => {
                if (err) {
                    console.error("❌ XML Parsing Error:", err);
                    return reject(err);
                }
                emailConfig = result.EmailConfig;
                console.log("✅ Config loaded successfully.");
                resolve(emailConfig);
            });
        });
    });
};

// Ensure configuration is loaded at startup
loadConfig().catch(() => console.log("⚠️ Continuing without config. Ensure Config.xml is available."));

// Email sending endpoint
app.post("/send-email", async (req, res) => {
    let { recipientEmail } = req.body;

    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: "❌ Recipient email is required!" });
    }

    try {
        // Reload config if empty
        if (!emailConfig.Sender) {
            await loadConfig();
        }

        // Validate email configuration
        if (!emailConfig.Sender || !emailConfig.Sender[0].Email || !emailConfig.Sender[0].Password) {
            return res.status(500).json({ success: false, message: "❌ Email configuration is missing." });
        }

        const senderEmail = emailConfig.Sender[0].Email[0];
        const senderPassword = emailConfig.Sender[0].Password[0];
        const subject = emailConfig.EmailContent[0].Subject[0];
        const body = emailConfig.EmailContent[0].Body[0];
        const attachmentPath = path.join(__dirname, emailConfig.Attachment[0].ResumePath[0]);

        // Check if the attachment file exists
        if (!fs.existsSync(attachmentPath)) {
            return res.status(500).json({ success: false, message: `❌ Attachment not found at ${attachmentPath}` });
        }

        const emailList = recipientEmail.split(",").map(email => email.trim());

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        // Send emails in parallel using Promise.all
        await Promise.all(emailList.map(email => {
            let mailOptions = {
                from: senderEmail,
                to: email,
                subject: subject,
                text: body,
                attachments: [{ path: attachmentPath }],
            };

            return transporter.sendMail(mailOptions).then(info => {
                console.log(`✅ Email sent to ${email}: ${info.response}`);
            }).catch(error => {
                console.error(`❌ Failed to send email to ${email}:`, error);
            });
        }));

        res.json({ success: true, message: "✅ Emails sent successfully!" });

    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ success: false, message: "❌ Failed to send email. Check server logs." });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
