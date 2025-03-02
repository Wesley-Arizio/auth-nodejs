export class Controller {
    #userService
    constructor({ userService }) {
        this.#userService = userService;
    }
    routes(key) {
        const routes = {
            "POST /api/auth/user": async (request, response) => {
                try {
                    const body = await this.parseBody(request);
                    this.#userService.create(body);
                    response.writeHead(200, { 'content-type': 'application/json'});
                    return response.end("User created")
                } catch (e) {
                    console.error(e);
                    response.writeHead(400, { 'content-type': 'application/json'})
                    return response.end(JSON.stringify({ message: "Internal Server Error" }))
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