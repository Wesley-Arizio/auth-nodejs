export class NotificationService {
  #transporter;
  constructor({ transporter }) {
    this.#transporter = transporter;
  }

  async sendResetTokenNotification({ token, expiresAt, to }) {
    return this.#transporter.sendMail({
      from: `"${process.env.USER_NAME_EMAIL}" ${process.env.USER_EMAIL}`,
      to,
      subject: "Mercadinho - Reset Password",
      html: `
        <h1>Reset Password</h1> <br />
        <p>Heres the link to set your new password: ${this.#getResetPasswordUrl(
          token
        )}</p>
        <p>This link expires at ${this.#formatResetPasswordExpiresAt(
          expiresAt
        )}</p>`,
    });
  }

  #getResetPasswordUrl(token) {
    return `${process.env.FRONT_END_URL}/reset-password?token=${token}`;
  }

  #formatResetPasswordExpiresAt(expiresAt) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    }).format(expiresAt);
  }
}
