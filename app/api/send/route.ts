import nodemailer from "nodemailer";
import type { ContactFormData } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, subject, message } = body;

    if (!email || !subject || !message || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ message: "Invalid email or missing fields" }),
        { status: 400 }
      );
    }

    await sendEmail({ email, subject, message });

    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(JSON.stringify({ message: "Failed to send email" }), {
      status: 500,
    });
  }
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.AUTH_USER,
    pass: process.env.AUTH_PASS,
  },
});

async function sendEmail({ email, subject, message }: ContactFormData) {
  const mailData = {
    to: process.env.AUTH_USER,
    from: email,
    subject: `[From Portfolio] ${subject}`,
    html: `
      <h1>${subject}</h1>
      <p>${message}</p>
      </br>
      <p><strong>From:</strong> ${email}</p>
      `,
  };

  return transporter.sendMail(mailData);
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
