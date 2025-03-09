import { InvalidCredentials } from "../error.js";
import {
  RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR,
  RESET_PASSWORD_TOKEN_LENGTH,
} from "../constants.js";
import { CredentialService } from "../service/credentialService.js";

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

  async updatePassword({ password, token }) {
    CredentialService.validatePassword(password);

    const tokenHash = this.#hashToken(token);
    const resetPasswordToken = await this.#resetPasswordRepository.get({
      tokenHash,
    });

    const isValidToken = this.#isValidResetToken(resetPasswordToken);

    if (!isValidToken) {
      throw new InvalidCredentials();
    }

    const hash = await CredentialService.hashPassword(password);

    const passwordUpdated = this.#credentialRepository.updatePassword({
      password: hash,
      credentialId: resetPasswordToken.credential_id,
    });

    const deactivatedToken =
      this.#resetPasswordRepository.deactivateResetPasswordToken({
        credentialId: resetPasswordToken.credential_id,
      });

    await Promise.all([passwordUpdated, deactivatedToken]);

    return true;
  }

  #isValidResetToken(resetPasswordToken) {
    if (!resetPasswordToken) {
      return false;
    }

    const isTokenUsed = !resetPasswordToken.used;
    const isTokenNotExpired = resetPasswordToken.expires_at > Date.now();

    return isTokenUsed && isTokenNotExpired;
  }

  #hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  #generateToken() {
    return crypto.randomBytes(RESET_PASSWORD_TOKEN_LENGTH).toString("hex");
  }
}
