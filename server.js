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

// Serve the frontend files
app.use(express.static(path.join(__dirname, "public")));

// Load email configuration from XML
let emailConfig = {};
const configPath = path.join(__dirname, "Config.xml");

fs.readFile(configPath, "utf-8", (err, data) => {
    if (err) {
        console.error("❌ Failed to load Config.xml:", err);
        return;
    }
    parseString(data, (err, result) => {
        if (err) {
            console.error("❌ XML Parsing Error:", err);
            return;
        }
        emailConfig = result.EmailConfig;
        console.log("✅ Config loaded successfully.");
    });
});

// Email sending endpoint
app.post("/send-email", async (req, res) => {
    let { recipientEmail } = req.body;
    
    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: "❌ Recipient email is required!" });
    }

    // Split multiple emails if provided
    const emailList = recipientEmail.split(",").map(email => email.trim());

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailConfig.Sender[0].Email[0],
                pass: emailConfig.Sender[0].Password[0],
            },
        });

        // Send emails one by one
        for (let email of emailList) {
            let mailOptions = {
                from: emailConfig.Sender[0].Email[0],
                to: email,
                subject: emailConfig.EmailContent[0].Subject[0],
                text: emailConfig.EmailContent[0].Body[0],
                attachments: [
                    {
                        path: path.join(__dirname, emailConfig.Attachment[0].ResumePath[0]),

                    },
                ],
            };

            let info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${email}: ${info.response}`);
        }

        res.json({ success: true, message: "✅ Emails sent successfully!" });

    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ success: false, message: "❌ Failed to send email. Check server logs." });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
