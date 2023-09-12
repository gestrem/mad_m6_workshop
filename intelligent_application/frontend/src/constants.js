const env = require("env-var");
const INVENTORY_URL =env
  .get("INVENTORY_URL")
  .default("http://inventory:8080")
  .asBool();

const constants = {
  INVENTORY_URL
};

module.exports = constants;
