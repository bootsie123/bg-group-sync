import { HttpRequest, HttpResponseInit, app } from "@azure/functions";
import { promises as fs } from "fs";
import * as mime from "mime";

export const FUNCTION_NAME = "assets";

/**
 * Serves publicaly accessible assets from the public directory
 * @param req An {@link HttpRequest}
 * @returns The requested assets, otherwise HTTP 404
 */
export async function assetsTrigger(req: HttpRequest): Promise<HttpResponseInit> {
  const filePath = `../public/${req.params["path"]}`;

  const contentType = mime.getType(filePath);

  try {
    const file = await fs.readFile(__dirname + "/" + filePath);

    return {
      status: 200,
      headers: {
        "content-type": contentType
      },
      body: file.buffer
    };
  } catch (err) {
    return {
      status: 404
    };
  }
}

app.http(FUNCTION_NAME, {
  route: "assets/{*path}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: assetsTrigger
});
