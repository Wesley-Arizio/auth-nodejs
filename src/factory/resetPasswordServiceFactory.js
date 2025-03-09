import { ResetPasswordService } from "../service/resetPasswordService.js";
import { CredentialRepository } from "../repository/credentialRepository.js";
import { ResetPasswordRepository } from "../repository/resetPasswordRepository.js";
import { notificationServiceFactory } from "./notificationServiceFactory.js";
import { connection } from "../knex.js";

export function resetPasswordServiceFactory() {
  return new ResetPasswordService({
    credentialRepository: new CredentialRepository({ connection }),
    resetPasswordRepository: new ResetPasswordRepository({ connection }),
    notificationService: notificationServiceFactory(),
  });
}
