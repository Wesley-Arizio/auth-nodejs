import { CredentialService } from "../service/credentialService.js";
import { CredentialRepository } from "../repository/credentialRepository.js";
import { SessionRepository } from "../repository/sessionRepository.js";
import { connection } from "../knex.js";

export function credentialServiceFactory() {
  return new CredentialService({
    credentialRepository: new CredentialRepository({ connection }),
    sessionRepository: new SessionRepository({ connection }),
  });
}
