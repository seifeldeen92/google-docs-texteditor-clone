import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

import Document from "./entity/Document";

const typeOrmConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "0000",
  database: "googledocsclone",
  synchronize: true,
  logging: false,
  entities: [Document],
};

export { typeOrmConfig };
