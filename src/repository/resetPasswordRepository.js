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
}
