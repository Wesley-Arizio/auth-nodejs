import { SALT_ROUNDS } from "../../src/constants.js";
import { InvalidCredentials, ValidationError } from "../../src/error.js";
import { CredentialService } from "../../src/service/credentialService.js";

import { expect, jest, test } from "@jest/globals";

describe("CredentialsService", () => {
  const factory = () => {
    const credentialRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      get: jest.fn(),
    };
    const sessionRepository = {
      create: jest.fn(),
    };
    const credentialService = new CredentialService({
      credentialRepository,
      sessionRepository,
    });

    return {
      credentialRepository,
      sessionRepository,
      credentialService,
    };
  };

  describe("create", () => {
    test("should fail when trying to create an account with an invalid email", async () => {
      const { credentialService } = factory();
      const invalidEmails = [
        "test@test",
        "test@testcom",
        "@test.com",
        "testgmail.com",
        "testgmailcom",
      ];

      for await (const email of invalidEmails) {
        await expect(() =>
          credentialService.create({ email, password: "Anything" })
        ).rejects.toThrow(new ValidationError("Invalid email format"));
      }
    });
    test("should fail when trying to create an account with an invalid password", async () => {
      const { credentialService } = factory();
      const invalidPasswords = [
        "Rtd!2", // Less than 6 characters
        "lKdyenhdppeE@@@", // No numbers
        "RFFFFFF34@", // No lower case letters
        "fffffffef1@", // No upper case letters
      ];

      for await (const password of invalidPasswords) {
        await expect(() =>
          credentialService.create({ email: "anything@gmail.com", password })
        ).rejects.toThrow(new ValidationError("Invalid password format"));
      }
    });
    test("should fail when trying to create an account that already exists", async () => {
      const user = {
        email: "test@gmail.com",
        password: "Test12345$",
      };
      const { credentialRepository, credentialService } = factory();
      credentialRepository.exists.mockImplementationOnce(() =>
        Promise.resolve({ email: "test@gmail.com" })
      );
      await expect(() => credentialService.create(user)).rejects.toThrow(
        new InvalidCredentials()
      );
      expect(credentialRepository.exists).toHaveBeenCalledWith(user.email);
    });

    test("should successfully create an account with valid credentials", async () => {
      const user = {
        email: "test@gmail.com",
        password: "Test12345$",
      };
      const { credentialRepository, credentialService } = factory();
      credentialRepository.exists.mockImplementationOnce(() =>
        Promise.resolve()
      );
      credentialRepository.create.mockImplementationOnce(() =>
        Promise.resolve({ email: user.email })
      );
      const response = await credentialService.create(user);
      expect(response).toBe(true);
      expect(credentialRepository.exists).toHaveBeenCalledWith(user.email);
      expect(credentialRepository.create).toHaveBeenCalledWith({
        email: user.email,
        password: expect.stringContaining(`$2b$${SALT_ROUNDS}$`),
      });
    });
  });

  describe("signIn", () => {
    test("should fail when signing in with a non-existent user", async () => {
      const user = {
        email: "anythig@gmail.com",
        password: "testtest",
      };

      const { credentialRepository, credentialService } = factory();
      credentialRepository.get.mockImplementationOnce(() =>
        Promise.resolve(undefined)
      );
      await expect(() => credentialService.signIn(user)).rejects.toThrow(
        new InvalidCredentials()
      );
      expect(credentialRepository.get).toHaveBeenCalledWith({
        email: user.email,
      });
    });
    test("should fail when signing in with an incorrect password", async () => {
      const user = {
        email: "anythig@gmail.com",
        password: "anythingelses",
      };

      const { credentialRepository, credentialService } = factory();
      credentialRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          password:
            "$2a$10$ZnxMLiQLmi0T41Ygj994wuhhMeM2a6Nck.uTlCsVyNd4PqlsTgxUq",
        })
      );
      await expect(() => credentialService.signIn(user)).rejects.toThrow(
        new InvalidCredentials()
      );
      expect(credentialRepository.get).toHaveBeenCalledWith({
        email: user.email,
      });
    });
    test("should successfully sign in with valid credentials", async () => {
      jest.useFakeTimers().setSystemTime(new Date("11/04/2001").getTime());
      const user = {
        email: "anythig@gmail.com",
        password: "correctpassword",
      };

      const { credentialRepository, credentialService, sessionRepository } =
        factory();
      credentialRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          id: "credentialId",
          password:
            "$2b$10$2wRcNmyKDbHUvBs.iato9.eXDlqeiVVm0gqsLZtGuI1VDho3ONAHG",
        })
      );
      sessionRepository.create.mockImplementationOnce(() =>
        Promise.resolve({ id: "session_id" })
      );
      const response = await credentialService.signIn(user);
      expect(response).toStrictEqual({
        id: "session_id",
        expiresAt: new Date("2001-11-11T02:00:00.000Z"),
      });
      expect(credentialRepository.get).toHaveBeenCalledWith({
        email: user.email,
      });
      expect(sessionRepository.create).toHaveBeenCalledWith({
        credentialId: "credentialId",
        expiresAt: new Date("2001-11-11T02:00:00.000Z"),
      });
    });
  });
});
