import nodemailer, { Transporter } from "nodemailer";


export const buildTransporter = (): Transporter => {
  const transporter =  nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL!,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        refreshToken: process.env.REFRESH_TOKEN!
      }
  })
  
  return transporter
}