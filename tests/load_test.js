const http = require("http");
const clients = Number(process.argv[2] || 10);
const requestsPerClient = Number(process.argv[3] || 10);
let completed = 0;
const started = Date.now();
for (let client = 0; client < clients; client++)
  for (let request = 0; request < requestsPerClient; request++)
    http
      .get(
        {
          host: "localhost",
          port: 8080,
          path: "/ HTTP/1.1\r\nHost: example.com",
        },
        (response) => {
          response.resume();
          response.on("end", () => {
            completed++;
            if (completed === clients * requestsPerClient)
              console.log(
                JSON.stringify(
                  {
                    clients,
                    total_requests: completed,
                    requests_per_second:
                      completed / ((Date.now() - started) / 1000),
                    average_latency_ms: (Date.now() - started) / completed,
                  },
                  null,
                  2,
                ),
              );
          });
        },
      )
      .on("error", () => {
        completed++;
      });
