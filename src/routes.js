export const routes = {
    "POST /auth/user": (_request, response) => {
        // TODO - create user logic
        response.writeHead(200, { 'content-type': 'application/json'});
        response.end("User created")
    },
    default: (_request, response) => {
        response.writeHead(404, { 'content-type': 'application/json'});
        return response.end("NOT FOUND");
    }
}