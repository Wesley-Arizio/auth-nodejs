import { Controller } from "../controller/controller.js";
import { credentialServiceFactory } from "../factory/credentialServiceFactory.js";
import { resetPasswordServiceFactory } from "../factory/resetPasswordServiceFactory.js";

export function controllerFactory() {
  const resetPasswordService = resetPasswordServiceFactory();
  const credentialsService = credentialServiceFactory();

  return new Controller({ credentialsService, resetPasswordService });
}
