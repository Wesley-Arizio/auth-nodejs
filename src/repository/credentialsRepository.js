export class CredentialsRepository {
  #connection;
  constructor({ connection }) {
    this.#connection = connection;
  }

  async exists(email) {
    const exists = await this.get({ email });
    return !!exists;
  }

  async create({ email, password }) {
    return this.#connection("credentials").insert({ email, password });
  }

  async get({ email }) {
    return this.#connection("credentials").select("*").where({ email }).first();
  }
}
