import { describe, test, expect, jest } from "@jest/globals";
import { ResetPasswordService } from "../../src/service/resetPasswordService";
import { InvalidCredentials } from "../../src/error";

describe("ResetPasswordService", () => {
  const factory = () => {
    const credentialRepository = {
      get: jest.fn(),
    };

    const resetPasswordRepository = {
      create: jest.fn(),
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

    notificationService.sendResetTokenNotification.mockImplementationOnce(() =>
      Promise.resolve()
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

    expect(notificationService.sendResetTokenNotification).toHaveBeenCalledWith(
      {
        token: expect.anything(),
        expiresAt: new Date("2001-11-04T12:32:10.000Z"),
        to: "test@gmail.com",
      }
    );
  });
});
