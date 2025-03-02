import { InvalidCredentials, ValidationError } from "../error.js";

import { hash, genSalt } from "bcrypt";

export class CredentialsService {
    #credentialsRepository;
    #saltRounds
    constructor({ credentialsRepository }) {
        this.#credentialsRepository = credentialsRepository;
        this.#saltRounds = process.env.SALT_ROUNDS;
    }

    async create({ email, password }) {
        this.#validateEmail(email);
        this.#validatePassword(password);

        const userExists = await this.#credentialsRepository.exists(email);

        if (userExists) {
            throw new InvalidCredentials();
        }

        const hash = await this.#hashPassword(password);
        const user = await this.#credentialsRepository.create({ email, password: hash });

        return !!user
    }

    #validateEmail(email) {
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            throw new ValidationError("Invalid email format")
        }
    }

    #validatePassword(password) {
        if (!/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[A-Z]).{6,}$/.test(password)) {
            throw new ValidationError("Invalid passowrd format - Minimum of 6 characters, must contain upper case letters, numbers and special character")
        }
    }

    async #hashPassword(passowrd) {
        const salt = await genSalt(this.#saltRounds);
        return hash(passowrd, salt);
    }
}