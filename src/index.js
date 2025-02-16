import * as http from "node:http";
import { routes } from "./routes.js";
import { URL } from "node:url";

const port = process.env.PORT || 3001;


const server = http.createServer((request, response) => {
    const url = new URL(`http://localhost:${port}${request.url}`);
    const key = `${request.method} ${url.pathname}`;
    return (routes[key] || routes.default)(request, response)
})

server.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${port}/`)
});