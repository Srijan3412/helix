import net from "net";

const client = net.connect({ port: 4000, host: "127.0.0.1" }, () => {
  console.log("Connected to 127.0.0.1:4000!");
  client.write("GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n");
});

client.on("data", (data) => {
  console.log("Received data:", data.toString());
  client.end();
});

client.on("error", (err) => {
  console.error("Connection error:", err);
});
