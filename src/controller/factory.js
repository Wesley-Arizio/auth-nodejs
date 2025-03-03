import { connection } from "../knex.js";
import { CredentialsRepository } from "../repository/credentialsRepository.js"
import { SessionsRepository } from "../repository/sessionsRepository.js"
import { CredentialsService } from "../service/credentialsService.js"
import { Controller } from "./controller.js";

export class ControllerFactory {
    static initialize() {
        const credentialsRepository = new CredentialsRepository({ connection });
        const sessionsRepository = new SessionsRepository({ connection })
        const credentialsService = new CredentialsService({ credentialsRepository, sessionsRepository });

        return new Controller({ credentialsService })
    }
}