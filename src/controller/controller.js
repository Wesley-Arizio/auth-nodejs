import { ServiceError } from "../error.js";

export class Controller {
    #credentialsService
    constructor({ credentialsService }) {
        this.#credentialsService = credentialsService;
    }
    routes(key) {
        const routes = {
            "POST /api/auth/user": async (request, response) => {
                try {
                    const body = await this.parseBody(request);
                    const result = await this.#credentialsService.create(body);
                    if (!result) {
                        response.writeHead(400);
                        return response.end();
                    }
                    response.writeHead(201);
                    return response.end();
                } catch (e) {
                    console.error(e);
                    if (e instanceof ServiceError) {
                        response.writeHead(e.status, { 'content-type': 'application/json'})
                        return response.end(JSON.stringify({ error: e.message }))
                    } else {
                        response.writeHead(400, { 'content-type': 'application/json'})
                        return response.end(JSON.stringify({ message: "Internal Server Error" }))
                    }
                }
            },
            default: (_request, response) => {
                response.writeHead(404, { 'content-type': 'application/json'});
                return response.end("NOT FOUND");
            }
        }

        return routes[key] || routes.default
    }


    // TODO - Implement id as a middleware
    parseBody = (request) => {
        return new Promise((resolve, reject) => {
            const body = [];
            request
                .on("data", (chunk) => body.push(chunk))
                .on("end", () => resolve(JSON.parse(Buffer.concat(body))))
                .on("error", reject);
        })
    }
}