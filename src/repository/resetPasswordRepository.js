export class ResetPasswordRepository {
  #connection;
  constructor({ connection }) {
    this.#connection = connection;
  }

  async create({ credentialId, tokenHash, expiresAt }) {
    return this.#connection("password_reset_tokens").insert({
      credential_id: credentialId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  }

  async get({ tokenHash }) {
    return this.#connection("password_reset_tokens")
      .select("*")
      .where({ token_hash: tokenHash })
      .first();
  }

  async deactivateResetPasswordToken({ credentialId }) {
    return this.#connection("password_reset_tokens")
      .update({ used: true })
      .where({ credential_id: credentialId });
  }
}
