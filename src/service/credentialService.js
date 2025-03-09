import { InvalidCredentials, ValidationError } from "../error.js";
import { SALT_ROUNDS, SESSION_EXPIRES_AT_ONE_WEEK } from "../constants.js";

import { hash, genSalt, compare } from "bcrypt";

export class CredentialService {
  #credentialRepository;
  #sessionRepository;
  constructor({ credentialRepository, sessionRepository }) {
    this.#credentialRepository = credentialRepository;
    this.#sessionRepository = sessionRepository;
  }

  async create({ email, password }) {
    CredentialService.validateEmail(email);
    CredentialService.validatePassword(password);

    const userExists = await this.#credentialRepository.exists(email);

    if (userExists) {
      throw new InvalidCredentials();
    }

    const hash = await CredentialService.hashPassword(password);
    const user = await this.#credentialRepository.create({
      email,
      password: hash,
    });

    return !!user;
  }

  async signIn({ email, password }) {
    const user = await this.#credentialRepository.get({ email });

    if (!user) {
      throw new InvalidCredentials();
    }

    const isCorrectPassword = await this.#isCorrectPassword(
      password,
      user.password
    );
    if (!isCorrectPassword) {
      throw new InvalidCredentials();
    }

    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_AT_ONE_WEEK);

    const session = await this.#sessionRepository.create({
      credentialId: user.id,
      expiresAt,
    });

    return {
      id: session.id,
      expiresAt,
    };
  }

  static validateEmail(email) {
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      throw new ValidationError("Invalid email format");
    }
  }

  static validatePassword(password) {
    if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(
        password
      )
    ) {
      throw new ValidationError("Invalid password format");
    }
  }

  static async hashPassword(passowrd) {
    const salt = await genSalt(SALT_ROUNDS);
    return hash(passowrd, salt);
  }

  async #isCorrectPassword(password, hash) {
    return compare(password, hash);
  }
}
