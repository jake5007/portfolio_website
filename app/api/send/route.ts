import nodemailer from "nodemailer";
import type { ContactFormData } from "@/types";

export async function POST(req: Request) {
  const body = await req.json();

  return sendEmail(body)
    .then(
      () =>
        new Response(JSON.stringify({ message: "Succeeded to send email" }), {
          status: 200,
        })
    )
    .catch((error) => {
      console.error(error);

      return new Response(JSON.stringify({ message: "Failed to send email" }), {
        status: 500,
      });
    });
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
    subject: `[From Portfolio] ${subject}`,
    from: email,
    html: `
      <h1>${subject}</h1>
      <p>${message}</p>
      </br>
      <p><strong>From:</strong> ${email}</p>
      `,
  };

  return transporter.sendMail(mailData);
}
