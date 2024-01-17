import EmailTemplate from "@/components/EmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request, res: Response) {
  const { email, subject, message } = await req.json();
  console.log(email, subject, message);

  try {
    const { data, error } = await resend.emails.send({
      from: email,
      to: ["hjchae5007@gmail.com"],
      subject: subject,
      react: EmailTemplate() as React.ReactElement,
    });

    if (error) {
      return Response.json({ error });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error });
  }
}
