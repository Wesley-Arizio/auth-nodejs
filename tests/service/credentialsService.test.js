import { SALT_ROUNDS } from "../../src/constants.js";
import { InvalidCredentials, ValidationError } from "../../src/error";
import { CredentialsService } from "../../src/service/credentialsService.js";

import { expect, jest, test } from '@jest/globals';

describe("CredentialsService", () => {

    const factory = () => {
        const credentialsRepository = {
            exists: jest.fn(),
            create: jest.fn(),
        };
        const sessionsRepository = {};
        const credentialService = new CredentialsService({
           credentialsRepository,
           sessionsRepository,
        });

        return {
            credentialsRepository,
            sessionsRepository,
            credentialService
        }
    }

    
    describe("create", () => {
        test("should fail when trying to create an account with an invalid email", async () => {
            const {credentialService} = factory();
            const invalidEmails = [
                "test@test",
                "test@testcom",
                "@test.com",
                "testgmail.com",
                "testgmailcom"
            ];

            for await (const email of invalidEmails) {
                await expect(() => credentialService.create({ email, password: "Anything" })).rejects.toThrow(
                    new ValidationError("Invalid email format")
                );
            }
        });
        test("should fail when trying to create an account with an invalid password", async () => {
            const {credentialService} = factory();
            const invalidPasswords = [
                "Rtd!2", // Less than 6 characters
                "lKdyenhdppeE@@@", // No numbers
                "RFFFFFF34@", // No lower case letters
                "fffffffef1@", // No upper case letters
            ];

            for await (const password of invalidPasswords) {
                await expect(() => credentialService.create({ email: "anything@gmail.com", password })).rejects.toThrow(
                    new ValidationError("Invalid password format")
                );
            }
        });
        test("should fail when trying to create an account that already exists", async () => {
            const user = { 
                email: "test@gmail.com",
                password: "Test12345$"
            };
            const {credentialsRepository, credentialService } = factory();
            credentialsRepository.exists.mockImplementationOnce(() => Promise.resolve({ email: "test@gmail.com" }))
            await expect(() => credentialService.create(user)).rejects.toThrow(new InvalidCredentials());
            expect(credentialsRepository.exists).toHaveBeenCalledWith(user.email);
        });

        test("should successfully create an account with valid credentials", async () => {
            const user = { 
                email: "test@gmail.com",
                password: "Test12345$"
            };
            const {credentialsRepository, credentialService } = factory();
            credentialsRepository.exists.mockImplementationOnce(() => Promise.resolve())
            credentialsRepository.create.mockImplementationOnce(() => Promise.resolve({ email: user.email }));
            const response = await credentialService.create(user);
            expect(response).toBe(true);
            expect(credentialsRepository.exists).toHaveBeenCalledWith(user.email);
            expect(credentialsRepository.create).toHaveBeenCalledWith({ email: user.email, password: expect.stringContaining(`$2b$${SALT_ROUNDS}$`)  })
        });
    });
});
