import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import { typeOrmConfig } from "./config";
import { createServer } from "http";
import { Server, Socket, ServerOptions } from "socket.io";
import Document from "./entity/Document";

const main = async () => {
  const conn = await createConnection(typeOrmConfig);
  console.log("PG connected.");

  const options: Partial<ServerOptions> = {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  };
  const httpServer = createServer();
  const io = new Server(httpServer, options);

  io.on("connection", (socket: Socket) => {
    socket.on("fetch-document-with-id", async (documentId: string) => {
      const document = await findOrCreateDocument(conn, documentId);
      socket.join(documentId);
      socket.emit("load-document", document.data);

      socket.on("send-delta", (delta) => {
        socket.broadcast.to(documentId).emit("receive-delta-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await findAndUpdateDocument(conn, documentId, data);
      });
    });
  });

  httpServer.listen(5000);
};

const findOrCreateDocument = async (conn: Connection, id: string) => {
  const documentRepo = conn.getRepository(Document);
  let document = await documentRepo.findOne(id);
  if (document) return document;

  document = new Document();
  document.id = id;
  document.data = {};
  await documentRepo.save(document).catch((err) => {
    console.log("Error: ", err);
  });
  console.log("New Document: ", document);
  return document;
};

const findAndUpdateDocument = async (
  conn: Connection,
  id: string,
  data: object
) => {
  const documentRepo = conn.getRepository(Document);
  let document = await documentRepo.findOne(id);
  await documentRepo
    .save({
      ...document,
      data,
    })
    .catch((err) => {
      console.log("Error: ", err);
    });
  console.log("New Document Updated: ", document);
};

main();
