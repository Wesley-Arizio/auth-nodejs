import { NotificationService } from "../service/notificationService.js";

import nodemalier from "nodemailer";

// TODO - improve email configuration
export function notificationServiceFactory() {
  return new NotificationService({
    transporter: nodemalier.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSWORD_EMAIL,
      },
    }),
  });
}
