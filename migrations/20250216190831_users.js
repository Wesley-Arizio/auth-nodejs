/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const up = function (knex) {
  return knex.schema
    .createTable("credentials", (table) => {
      table
        .uuid("id")
        .notNullable()
        .unique()
        .primary()
        .defaultTo(knex.fn.uuid());
      table.string("email").notNullable().unique();
      table.string("password").notNullable();
      table.boolean("active").notNullable().defaultTo(true);
    })
    .createTable("sessions", (table) => {
      table
        .uuid("id")
        .notNullable()
        .unique()
        .primary()
        .defaultTo(knex.fn.uuid());
      table
        .dateTime("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
      table.dateTime("expires_at").notNullable();
      table.boolean("active").defaultTo(true);
      table.uuid("credential_id").notNullable();
      table
        .foreign("credential_id")
        .references("credentials.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
    })
    .createTable("password_reset_tokens", (table) => {
      table
        .uuid("id")
        .notNullable()
        .unique()
        .primary()
        .defaultTo(knex.fn.uuid());
      table.uuid("credential_id").notNullable();
      table.string("token_hash").notNullable();
      table.dateTime("expires_at").notNullable();
      table.boolean("used").notNullable().defaultTo(false);
      table
        .foreign("credential_id")
        .references("credentials.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const down = function (knex) {
  return knex.schema
    .dropTable("password_reset_tokens")
    .dropTable("sessions")
    .dropTable("credentials");
};

export { up, down };
