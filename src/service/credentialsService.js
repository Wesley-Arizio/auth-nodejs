import { InvalidCredentials, ValidationError } from "../error.js";
import { SALT_ROUNDS, SESSION_EXPIRES_AT_ONE_WEEK } from "../constants.js";

import { hash, genSalt, compare } from "bcrypt";

export class CredentialsService {
    #credentialsRepository;
    #sessionsRepository;
    constructor({ credentialsRepository, sessionsRepository }) {
        this.#credentialsRepository = credentialsRepository;
        this.#sessionsRepository = sessionsRepository;
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

    async signIn({ email, password }) {
        const user = await this.#credentialsRepository.get({ email });

        if (!user) {
            throw new InvalidCredentials();
        }

        const isCorrectPassword = await this.#isCorrectPassword(password, user.password);
        if (!isCorrectPassword) {
            throw new InvalidCredentials();
        }

        const expiresAt = new Date(Date.now() + SESSION_EXPIRES_AT_ONE_WEEK);

        const session = await this.#sessionsRepository.create({ credentialId: user.id, expiresAt });

        return {
            id: session.id,
            expiresAt,
        }
    }


    #validateEmail(email) {
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            throw new ValidationError("Invalid email format")
        }
    }

    #validatePassword(password) {
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(password)) {
            throw new ValidationError("Invalid password format")
        }
    }

    async #hashPassword(passowrd) {
        const salt = await genSalt(SALT_ROUNDS);
        return hash(passowrd, salt);
    }

    async #isCorrectPassword(password, hash) {
        return compare(password, hash)
    }
}