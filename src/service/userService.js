export class UserService {
    #userRepository;
    constructor({ userRepository }) {
        this.#userRepository = userRepository;
    }

    async create({ email, password }) {
        console.log({ email, password })
        // Validate email using regex
        // Validate password (few security rules)
        // validate email already registered
        // create credentials
    }
}