import http from "node:http";
import url from "node:url";

let todos = [];
let idCounter = 1;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const getRequestBody = (req) =>
	new Promise((res, rej) => {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", () => res(body ? JSON.parse(body) : {}));
		req.on("error", rej);
	});

const server = http.createServer(async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

	if (req.method === "OPTIONS") { // for CORS i think
		res.writeHead(204);
		res.end();
		return;
	}

	await delay(500);
	const { pathname } = url.parse(req.url, true);
	const method = req.method;


	if (method === "GET" && pathname === "/todos") {
		res.writeHead(200);
		res.end(JSON.stringify(todos));
		return;
	}

	if (method === "POST" && pathname === "/todos") {
    const body = await getRequestBody(req);

		if (body.text === "take down prod") {
			res.writeHead(500);
			res.end(JSON.stringify({ error: "server rejects this text" }));
			return;
		}
    
		const todo = {
			id: idCounter++,
			text: body.text ?? "",
			done: false,
		};

		todos.push(todo);
		res.writeHead(201);
		res.end(JSON.stringify(todo));
		return;
	}

	if (method === "PUT" && pathname.startsWith("/todos/")) {
		const id = parseInt(pathname.split("/")[2]);
		const index = todos.findIndex((t) => t.id === id);
		const todo = todos[index];

		if (todo === undefined) {
			res.writeHead(404);
			res.end(JSON.stringify({ error: "Todo not found" }));
			return;
		}

		const body = await getRequestBody(req);

		todos[index] = {
			...todo,
			text: body.text ?? todo.text,
			done: body.done ?? todo.done,
		};

		res.writeHead(200);
		res.end(JSON.stringify(todos[index]));
		return;
	}

	if (method === "DELETE" && pathname.startsWith("/todos/")) {
		const id = parseInt(pathname.split("/")[2]);
		const index = todos.findIndex((t) => t.id === id);

		if (index === -1) {
			res.writeHead(404);
			res.end(JSON.stringify({ error: "Todo not found" }));
			return;
		}

		todos.splice(index, 1);
		res.writeHead(204);
		res.end();
		return;
	}

	res.writeHead(404);
	res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3000;

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
