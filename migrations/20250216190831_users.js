/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const up = function(knex) {
    return knex.schema.createTable("credentials", table => {
        table.uuid("id").notNullable().unique().primary().defaultTo(knex.fn.uuid())
        table.string("email").notNullable().unique();
        table.string("password").notNullable();
        table.boolean("active").notNullable().defaultTo(true);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const down = function(knex) {
    return knex.schema.dropTable("credentials");
};

export { up, down };
