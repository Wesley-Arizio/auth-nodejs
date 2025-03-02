import { connection } from "../knex.js";
import { UserRepository } from "../repository/userRepository.js"
import { UserService } from "../service/userService.js"
import { Controller } from "./controller.js";

export class ControllerFactory {
    static initialize() {
        const userRepository = new UserRepository({ connection });
        const userService = new UserService({ userRepository });

        return new Controller({ userService })
    }
}