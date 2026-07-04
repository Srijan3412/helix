import net from "net";

function sendRawPost(path: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const reqStr = [
      `POST ${path} HTTP/1.1`,
      "Host: 127.0.0.1:4000",
      "Content-Type: application/json",
      `Content-Length: ${Buffer.byteLength(body)}`,
      "Connection: close",
      "",
      body
    ].join("\r\n");

    const client = net.connect({ port: 4000, host: "127.0.0.1" }, () => {
      client.write(reqStr);
    });

    let resStr = "";
    client.on("data", (chunk) => resStr += chunk.toString());
    client.on("end", () => {
      try {
        const bodyStart = resStr.indexOf("\r\n\r\n") + 4;
        const resBody = resStr.substring(bodyStart);
        resolve(JSON.parse(resBody));
      } catch (e) {
        reject(new Error(`Failed to parse response: ${resStr}`));
      }
    });
    client.on("error", reject);
  });
}

function sendRawGet(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqStr = [
      `GET ${path} HTTP/1.1`,
      "Host: 127.0.0.1:4000",
      "Connection: close",
      "",
      ""
    ].join("\r\n");

    const client = net.connect({ port: 4000, host: "127.0.0.1" }, () => {
      client.write(reqStr);
    });

    let resStr = "";
    client.on("data", (chunk) => resStr += chunk.toString());
    client.on("end", () => {
      try {
        const bodyStart = resStr.indexOf("\r\n\r\n") + 4;
        const resBody = resStr.substring(bodyStart);
        resolve(JSON.parse(resBody));
      } catch (e) {
        reject(new Error(`Failed to parse response: ${resStr}`));
      }
    });
    client.on("error", reject);
  });
}

async function main() {
  console.log("Triggering analysis job using raw TCP sockets...");
  try {
    const postData = await sendRawPost("/api/analyze", {
      url: "https://github.com/Srijan3412/TaskMang.git"
    });
    const jobId = postData.jobId;
    console.log(`Job enqueued successfully! JobID: ${jobId}`);

    // Poll status
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusData = await sendRawGet(`/api/analyze/${jobId}/status`);
      const status = statusData.status;
      console.log(`Polling job ${jobId} status: ${status}`);

      if (status === "completed") {
        console.log("Job completed successfully!");
        const resultData = await sendRawGet(`/api/analyze/${jobId}/results`);
        console.log("AI Summary generated:");
        console.log(JSON.stringify(resultData.aiSummary, null, 2));
        break;
      } else if (status === "failed") {
        console.error("Job failed!");
        break;
      }
    }
  } catch (err: any) {
    console.error("Error triggering or polling:", err.message);
  }
}

main().catch(console.error);
