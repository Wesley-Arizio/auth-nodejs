import { ServiceError } from "../error.js";
import cookie from "cookie";

export class Controller {
    #credentialsService
    constructor({ credentialsService }) {
        this.#credentialsService = credentialsService;
    }


    routes(key) {
        const routes = {
            "POST /api/auth/credential": async (request, response) => {
                const result = await this.#credentialsService.create(request.body);
                if (!result) {
                    response.writeHead(400);
                    return response.end();
                }
                response.writeHead(201);
                return response.end();
            },
            "POST /api/auth/signin": async (request, response) => {
                const result = await this.#credentialsService.signIn(request.body);

                const serializedCookie = cookie.serialize("session", result.id, {
                    httpOnly: true,
                    maxAge: result.expiresAt,
                    path: "/",
                    secure: true,
                    sameSite: "strict"
                });

                response.setHeader("Set-Cookie", serializedCookie);

                response.writeHead(200);
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
                        console.error(e);
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