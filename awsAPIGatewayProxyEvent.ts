import { isObject } from "@suin/is-object";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
} from "aws-lambda";

export const isAwsAPIGatewayProxyEvent = (
  request: unknown,
): request is APIGatewayProxyEvent =>
  isObject<APIGatewayProxyEvent>(request) &&
  typeof request.httpMethod === "string" &&
  isObject<APIGatewayProxyEventHeaders>(request.headers) &&
  (request.body === null || typeof request.body === "string");

export const awsAPIGatewayProxyEventToRequest = (
  request: APIGatewayProxyEvent,
): Request => {
  const init: RequestInit = {
    method: request.httpMethod,
    headers: toHeaders(request.headers),
    body: request.body,
    duplex: "half",
  };
  if (request.httpMethod) {
    init.method = request.httpMethod;
  }
  return new Request(request.path ?? "/", init);
};

const toHeaders = (eventHeaders: APIGatewayProxyEventHeaders): Headers => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(eventHeaders)) {
    if (typeof value === "string") {
      headers.append(key, value);
    }
  }
  return headers;
};
