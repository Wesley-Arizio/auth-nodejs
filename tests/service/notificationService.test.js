import { describe, expect, jest } from "@jest/globals";
import { NotificationService } from "../../src/service/notificationService.js";

describe("NotificationService", () => {
  const factory = () => {
    const transporter = {
      sendMail: jest.fn(),
    };

    const notificationService = new NotificationService({ transporter });

    return { transporter, notificationService };
  };

  it("should be able to send reset password link with correct mail content", async () => {
    jest.useFakeTimers().setSystemTime(new Date("11/04/2001").getTime());
    const { transporter, notificationService } = factory();

    process.env.USER_NAME_EMAIL = "Mikael";
    process.env.USER_EMAIL = "mikael@gmail.com";
    process.env.FRONT_END_URL = "http://localhost:3001";

    transporter.sendMail.mockImplementationOnce(() => Promise.resolve(true));

    const response = await notificationService.sendResetTokenNotification({
      token: "token",
      expiresAt: new Date(),
      to: "receiver@gmail.com",
    });

    expect(response).toBe(true);
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: '"Mikael" mikael@gmail.com',
      to: "receiver@gmail.com",
      subject: "Mercadinho - Reset Password",
      html: `
        <h1>Reset Password</h1> <br />
        <p>Heres the link to set your new password: http://localhost:3001/reset-password?token=token</p>
        <p>This link expires at 11/04/2001, 00:00:00</p>`,
    });
  });
});
