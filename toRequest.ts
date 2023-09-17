import type { APIGatewayProxyEvent } from "aws-lambda";
import type { IncomingMessage } from "http";
import {
  awsAPIGatewayProxyEventToRequest,
  isAwsAPIGatewayProxyEvent,
} from "./awsAPIGatewayProxyEvent";
import { incomingMessageToRequest, isIncomingMessage } from "./incomingMessage";

export const toRequest = (request: RequestLike): Request => {
  if (isAwsAPIGatewayProxyEvent(request)) {
    return awsAPIGatewayProxyEventToRequest(request);
  }
  if (isIncomingMessage(request)) {
    return incomingMessageToRequest(request);
  }
  return request;
};

/**
 * Any HTTP request object of:
 *
 * - Request: Fetch API request, used in Vercel Edge Function
 * - IncomingMessage: Node.js http module request, used in Vercel Functions, Express, Koa and so on
 * - APIGatewayProxyEvent: AWS Lambda request, used in Netlify Functions
 */
export type RequestLike = Request | IncomingMessage | APIGatewayProxyEvent;
