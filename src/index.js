import * as http from "node:http";
import { URL } from "node:url";
import { controllerFactory } from "./factory/controllerFactory.js";

const port = process.env.PORT || 3001;

const server = http.createServer((request, response) => {
  const url = new URL(`http://localhost:${port}${request.url}`);
  const key = `${request.method} ${url.pathname}`;
  const controller = controllerFactory();
  return controller.routes(key)(request, response);
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
