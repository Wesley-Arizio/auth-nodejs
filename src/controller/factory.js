import { connection } from "../knex.js";
import { CredentialsRepository } from "../repository/credentialsRepository.js"
import { CredentialsService } from "../service/credentialsService.js"
import { Controller } from "./controller.js";

export class ControllerFactory {
    static initialize() {
        const credentialsRepository = new CredentialsRepository({ connection });
        const credentialsService = new CredentialsService({ credentialsRepository });

        return new Controller({ credentialsService })
    }
}