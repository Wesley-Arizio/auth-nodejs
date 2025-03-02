export class CredentialsRepository {
    #connection;
    constructor({ connection }) {
        this.#connection = connection;
    }

    async exists(email) {
        const exists = await this.#connection("credentials").select("*").where({ email }).first();
        return !!exists
    }

    async create({ email, password }) {
        return this.#connection("credentials").insert({ email, password });
    }
}