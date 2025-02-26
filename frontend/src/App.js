import React, { useState } from "react";

const EmailSender = () => {
    const [email, setEmail] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const sendEmail = async () => {
        if (!email) {
            setStatusMessage("❌ Please enter an email!");
            return;
        }

        try {
            let response = await fetch("http://localhost:5000/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientEmail: email }),
            });

            let data = await response.json();
            setStatusMessage(data.message);

        } catch (error) {
            console.error("❌ Error:", error);
            setStatusMessage("❌ Failed to send email.");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Email Sender</h2>
            <input
                type="email"
                placeholder="Enter recipient email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: "10px", width: "250px" }}
            />
            <button onClick={sendEmail} style={{ padding: "10px 15px", marginLeft: "10px" }}>
                Send Email
            </button>
            <p>{statusMessage}</p>
        </div>
    );
};

export default EmailSender;
