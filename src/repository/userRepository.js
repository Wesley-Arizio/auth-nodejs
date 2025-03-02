export class UserRepository {
    #connection;
    constructor({ connection }) {
        this.#connection = connection;
    }
}