import { ServiceError } from "../error.js";

export class Controller {
    #credentialsService
    constructor({ credentialsService }) {
        this.#credentialsService = credentialsService;
    }


    routes(key) {
        const routes = {
            "POST /api/auth/user": async (request, response) => {
                const result = await this.#credentialsService.create(request.body);
                if (!result) {
                    response.writeHead(400);
                    return response.end();
                }
                response.writeHead(201);
                return response.end();
            },
            default: (_request, response) => {
                response.writeHead(404, { 'content-type': 'application/json'});
                return response.end("NOT FOUND");
            }
        }

        const proxy = new Proxy(routes, this.#handler());

        return proxy[key] || proxy.default
    }

    #handler() {
        return {
            get: (obj, prop) => {
                return async (request, response) => {
                    try {
                        if (request.method === "POST") {
                            request.body = await Controller.parseBody(request);
                        }
                        return await obj[prop].call(this, request, response);
                    } catch (e) {
                        if (e instanceof ServiceError) {
                            response.writeHead(e.status, { 'content-type': 'application/json'})
                            return response.end(JSON.stringify({ error: e.message }))
                        } else {
                            response.writeHead(500, { 'content-type': 'application/json'})
                            return response.end(JSON.stringify({ message: "Internal Server Error" }))
                        }
                    }
                    
                }
            }
        }
    }


    // TODO - Implement id as a middleware
    static parseBody(request) {
        return new Promise((resolve, reject) => {
            const body = [];
            request
                .on("data", (chunk) => body.push(chunk))
                .on("end", () => resolve(JSON.parse(Buffer.concat(body))))
                .on("error", reject);
        })
    }
}