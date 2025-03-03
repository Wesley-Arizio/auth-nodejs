export class SessionsRepository {
    #connection;
    constructor({ connection }) {
        this.#connection = connection;
    }

    async create({ credentialId, expiresAt }) {
        const [credential] = await this.#connection("sessions").insert({ credential_id: credentialId, expires_at: expiresAt }).returning("*");
        return credential;
    }

    // async get({ email }) {
    //     return this.#connection("sessions").select("*").where({ email }).first();
    // }
}