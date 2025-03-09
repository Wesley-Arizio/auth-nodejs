import { InvalidCredentials } from "../error.js";
import {
  RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR,
  RESET_PASSWORD_TOKEN_LENGTH,
} from "../constants.js";

import crypto from "node:crypto";

export class ResetPasswordService {
  #credentialRepository;
  #resetPasswordRepository;
  #notificationService;
  constructor({
    credentialRepository,
    resetPasswordRepository,
    notificationService,
  }) {
    this.#credentialRepository = credentialRepository;
    this.#resetPasswordRepository = resetPasswordRepository;
    this.#notificationService = notificationService;
  }

  async resetPassword({ email }) {
    const credential = await this.#credentialRepository.get({ email });

    if (!credential) {
      throw new InvalidCredentials();
    }

    const token = this.#generateToken();
    const expiresAt = new Date(
      Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR
    );

    const resetToken = this.#resetPasswordRepository.create({
      credentialId: credential.id,
      tokenHash: this.#hashToken(token),
      expiresAt,
    });

    const notification = this.#notificationService.sendResetTokenNotification({
      token,
      expiresAt,
      to: credential.email,
    });

    await Promise.all([resetToken, notification]);

    return true;
  }

  #hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  #generateToken() {
    return crypto.randomBytes(RESET_PASSWORD_TOKEN_LENGTH).toString("hex");
  }
}
