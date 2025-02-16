import knex from "knex";
import config from "../knexfile.js";

const option = {
    development: config.development,
    staging: config.staging,
    production: config.production
}[process.env.NODE_ENV] || option.development;

export const connection = knex(option);