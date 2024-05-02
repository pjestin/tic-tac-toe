/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

function getPossibilities(gridData: string[][]): { row: number, col: number }[] {
	let posibilities: { row: number, col: number }[] = [];

	for (let row = 0; row < gridData.length; row++) {
		for (let col = 0; col < gridData[0].length; col++) {
			if (gridData[row][col] === '') {
				posibilities.push({ row, col });
			}
		}
	}

	return posibilities;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== "POST") {
			return new Response('Method Not Allowed', { status: 405 });
		}

		const url = new URL(request.url);
		if (url.pathname !== '/play') {
			return new Response('Not Found', { status: 404 });
		}

		if (request.headers.get('Content-Type') !== 'application/json') {
			return new Response('Expecting JSON body', { status: 400 });
		}

		const requestBody = await request.json() as { gridData: string[][] | undefined };
		if (!requestBody.gridData) {
			return new Response('Missing grid data', { status: 400 });
		}

		let { gridData } = requestBody;

		let possibilities = getPossibilities(gridData);
		if (possibilities.length === 0) {
			return new Response('No possibility for computer', { status: 409 });
		}
	
		const index = Math.floor(Math.random() * possibilities.length);
		const computerPosition = possibilities[index];
		possibilities.splice(index, 1);

		gridData

		return Response.json({ computerPosition, possibilities });
	},
};
