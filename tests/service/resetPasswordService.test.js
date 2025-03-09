import { describe, test, expect, jest } from "@jest/globals";
import { ResetPasswordService } from "../../src/service/resetPasswordService";
import { InvalidCredentials, ValidationError } from "../../src/error";
import { RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR } from "../../src/constants";

describe("ResetPasswordService", () => {
  const factory = () => {
    const credentialRepository = {
      get: jest.fn(),
      updatePassword: jest.fn(),
    };

    const resetPasswordRepository = {
      create: jest.fn(),
      get: jest.fn(),
      deactivateResetPasswordToken: jest.fn(),
    };

    const notificationService = {
      sendResetTokenNotification: jest.fn(),
    };

    const resetPasswordService = new ResetPasswordService({
      credentialRepository,
      resetPasswordRepository,
      notificationService,
    });

    return {
      credentialRepository,
      resetPasswordRepository,
      notificationService,
      resetPasswordService,
    };
  };

  describe("resetPassword", () => {
    test("should return an error if given credentials do not exist", async () => {
      const { credentialRepository, resetPasswordService } = factory();

      credentialRepository.get.mockImplementationOnce(() =>
        Promise.resolve(undefined)
      );
      await expect(() =>
        resetPasswordService.resetPassword({ email: "test@gmail.com" })
      ).rejects.toThrow(new InvalidCredentials());
      expect(credentialRepository.get).toHaveBeenCalledWith({
        email: "test@gmail.com",
      });
    });
    test("should create reset password token successfuly given existing credentials", async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date("2001-11-04T11:32:10.000Z").getTime());
      const {
        credentialRepository,
        resetPasswordService,
        resetPasswordRepository,
        notificationService,
      } = factory();

      credentialRepository.get.mockImplementationOnce(() =>
        Promise.resolve({ id: "1234", email: "test@gmail.com" })
      );

      resetPasswordRepository.create.mockImplementationOnce(() =>
        Promise.resolve()
      );

      notificationService.sendResetTokenNotification.mockImplementationOnce(
        () => Promise.resolve()
      );

      const response = await resetPasswordService.resetPassword({
        email: "test@gmail.com",
      });

      expect(response).toBe(true);

      expect(credentialRepository.get).toHaveBeenCalledWith({
        email: "test@gmail.com",
      });
      expect(resetPasswordRepository.create).toHaveBeenCalledWith({
        credentialId: "1234",
        tokenHash: expect.anything(),
        expiresAt: new Date("2001-11-04T12:32:10.000Z"),
      });

      expect(
        notificationService.sendResetTokenNotification
      ).toHaveBeenCalledWith({
        token: expect.anything(),
        expiresAt: new Date("2001-11-04T12:32:10.000Z"),
        to: "test@gmail.com",
      });
    });
  });

  describe("updatePassword", () => {
    test("should return an error when attempting to update the password with an invalid password format", async () => {
      const { resetPasswordService } = factory();
      const invalidPasswords = [
        "Rtd!2", // Less than 6 characters
        "lKdyenhdppeE@@@", // No numbers
        "RFFFFFF34@", // No lower case letters
        "fffffffef1@", // No upper case letters
      ];

      for await (const pass of invalidPasswords) {
        await expect(() =>
          resetPasswordService.updatePassword({
            password: pass,
            token: "token",
          })
        ).rejects.toThrow(new ValidationError("Invalid password format"));
      }
    });
    test("should return an error when attempting to update the password with a non-existing reset password token", async () => {
      const { resetPasswordService, resetPasswordRepository } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve(undefined)
      );

      await expect(() =>
        resetPasswordService.updatePassword({
          password: "test@43D",
          token: "token",
        })
      ).rejects.toThrow(new InvalidCredentials());
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
    });
    test("should return an error when attempting to update the password with an already used reset password token", async () => {
      jest.useFakeTimers().setSystemTime(new Date("11/04/2001").getTime());
      const { resetPasswordService, resetPasswordRepository } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve({ used: true, expires_at: new Date("12/04/2001") })
      );

      await expect(() =>
        resetPasswordService.updatePassword({
          password: "test@43D",
          token: "token",
        })
      ).rejects.toThrow(new InvalidCredentials());
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
    });
    test("should return an error when attempting to update the password with an expired reset password token", async () => {
      const { resetPasswordService, resetPasswordRepository } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          used: false,
          expires_at: new Date("11/04/2001"),
        })
      );

      await expect(() =>
        resetPasswordService.updatePassword({
          password: "test@43D",
          token: "token",
        })
      ).rejects.toThrow(new InvalidCredentials());
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
    });
    test("should throw an error if the password update process fails", async () => {
      const {
        resetPasswordService,
        resetPasswordRepository,
        credentialRepository,
      } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          used: false,
          credential_id: "any id",
          expires_at: new Date(
            Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR
          ),
        })
      );

      credentialRepository.updatePassword.mockRejectedValueOnce(
        new Error("anything")
      );
      resetPasswordRepository.deactivateResetPasswordToken.mockResolvedValueOnce(
        {}
      );

      await expect(() =>
        resetPasswordService.updatePassword({
          password: "test@43D",
          token: "token",
        })
      ).rejects.toThrow(new Error("anything"));
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
      expect(credentialRepository.updatePassword).toHaveBeenCalledWith({
        password: expect.anything(),
        credentialId: "any id",
      });
      expect(
        resetPasswordRepository.deactivateResetPasswordToken
      ).toHaveBeenCalledWith({
        credentialId: "any id",
      });
    });
    test("should throw an error if deactivating the reset password token fails", async () => {
      const {
        resetPasswordService,
        resetPasswordRepository,
        credentialRepository,
      } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          used: false,
          credential_id: "any id",
          expires_at: new Date(
            Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR
          ),
        })
      );

      credentialRepository.updatePassword.mockResolvedValueOnce({});
      resetPasswordRepository.deactivateResetPasswordToken.mockRejectedValueOnce(
        new Error("anything")
      );

      await expect(() =>
        resetPasswordService.updatePassword({
          password: "test@43D",
          token: "token",
        })
      ).rejects.toThrow(new Error("anything"));
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
      expect(credentialRepository.updatePassword).toHaveBeenCalledWith({
        password: expect.anything(),
        credentialId: "any id",
      });
      expect(
        resetPasswordRepository.deactivateResetPasswordToken
      ).toHaveBeenCalledWith({
        credentialId: "any id",
      });
    });
    test("should successfully update the password when a valid reset password token is provided", async () => {
      const {
        resetPasswordService,
        resetPasswordRepository,
        credentialRepository,
      } = factory();

      resetPasswordRepository.get.mockImplementationOnce(() =>
        Promise.resolve({
          used: false,
          credential_id: "any id",
          expires_at: new Date(
            Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_AT_ONE_HOUR
          ),
        })
      );

      credentialRepository.updatePassword.mockResolvedValueOnce({});
      resetPasswordRepository.deactivateResetPasswordToken.mockResolvedValueOnce(
        {}
      );
      const response = await resetPasswordService.updatePassword({
        password: "test@43D",
        token: "token",
      });
      expect(response).toBe(true);
      expect(resetPasswordRepository.get).toHaveBeenCalledWith({
        tokenHash:
          "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
      });
      expect(credentialRepository.updatePassword).toHaveBeenCalledWith({
        password: expect.anything(),
        credentialId: "any id",
      });
      expect(
        resetPasswordRepository.deactivateResetPasswordToken
      ).toHaveBeenCalledWith({
        credentialId: "any id",
      });
    });
  });
});
