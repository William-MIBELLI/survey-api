import nodemailer, { Transporter } from "nodemailer";

export type TEmailResetPassword = {
  email: string;
  token: string;
};

export default class MailService {
  constructor(private transporter: Transporter) {}

  public async sendResetPasswordEmail({
    email,
    token,
  }: TEmailResetPassword): Promise<boolean> {
    const url = `${process.env.FRONTEND_URL!}/resetPassword/${token}`;
    try {
      const response = await this.transporter.sendMail({
        from: process.env.EMAIL!,
        to: email,
        subject: "Reset password",
        html: `
          <div>
            <h2>New ask for reset password</h2>
            <p>Hello dear customer. You ask for reseting your password, just click the link bellow and follow the few steps.</p>
            <a href="${url}">Reset my password</a>
          </div>
        `,
      });
      console.log("SUCCESS RESPONSE MAIL : ", response);
      return true;
    } catch (error: any) {
      console.log("ERROR SENDING MAIL : ", error?.message);
      throw new Error("Sending email failed.")
    }
  }
}
