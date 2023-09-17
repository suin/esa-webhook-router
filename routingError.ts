export class RoutingError extends Error {
  readonly type:
    | "cannotReadBody"
    | "missingSignature"
    | "cannotParseSignature"
    | "cannotVerifySignature"
    | "invalidSignature"
    | "cannotReadJson"
    | "unsupportedEvent";
  readonly category: "clientError" | "serverError";
  readonly request: Request;

  constructor({
    type,
    message,
    category,
    request,
    cause,
  }: {
    type: RoutingError["type"];
    message: string;
    category: RoutingError["category"];
    request: Request;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.type = type;
    this.name = "RoutingError";
    this.request = request;
    this.category = category;
  }

  get httpStatus(): number {
    switch (this.category) {
      case "clientError":
        return 400;
      case "serverError":
        return 500;
    }
  }

  static cannotReadBody({
    request,
    cause,
  }: {
    request: Request;
    cause: unknown;
  }): RoutingError {
    return new RoutingError({
      type: "cannotReadBody",
      message: `Cannot read body: ${cause}`,
      category: "serverError",
      request,
      cause,
    });
  }

  static missingSignature({ request }: { request: Request }) {
    return new RoutingError({
      type: "missingSignature",
      message: "Signature is missing",
      category: "clientError",
      request,
    });
  }

  static cannotParseSignature({
    request,
    signature,
  }: {
    request: Request;
    signature: string;
  }) {
    return new RoutingError({
      type: "cannotParseSignature",
      message: `Cannot parse signature: ${signature}`,
      category: "clientError",
      request,
    });
  }

  static cannotVerifySignature({
    request,
    cause,
  }: {
    request: Request;
    cause: any;
  }) {
    return new RoutingError({
      type: "cannotVerifySignature",
      message: `Cannot verify signature: ${cause}`,
      category: "serverError",
      request,
      cause,
    });
  }

  static invalidSignature({
    request,
    signature,
  }: {
    request: Request;
    signature: string;
  }): RoutingError {
    return new RoutingError({
      type: "invalidSignature",
      message: `Invalid signature provided: ${signature}`,
      category: "clientError",
      request,
    });
  }

  static cannotReadJson({
    request,
    cause,
  }: {
    request: Request;
    cause: unknown;
  }): RoutingError {
    return new RoutingError({
      type: "cannotReadJson",
      message: `Cannot read body as JSON: ${cause}`,
      category: "clientError",
      request,
      cause,
    });
  }

  static unsupportedEvent({
    request,
    errors,
  }: {
    request: Request;
    errors: string[];
  }): RoutingError {
    return new RoutingError({
      type: "unsupportedEvent",
      message: `Unsupported event: ${errors.join(" ")}`,
      category: "clientError",
      request,
    });
  }
}
