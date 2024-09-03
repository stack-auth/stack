import { globalVar } from "./globals";
import { Json } from "./json";


export function throwErr(errorMessage: string, extraData?: any): never;
export function throwErr(error: Error): never;
export function throwErr(...args: StatusErrorConstructorParameters): never;
export function throwErr(...args: any[]): never {
  if (typeof args[0] === "string") {
    throw new StackAssertionError(args[0], args[1]);
  } else if (args[0] instanceof Error) {
    throw args[0];
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    throw new StatusError(...args);
  }
}


export class StackAssertionError extends Error implements ErrorWithCustomCapture {
  constructor(message: string, public readonly extraData?: Record<string, any>, options?: ErrorOptions) {
    const disclaimer = `\n\nThis is likely an error in Stack. Please make sure you are running the newest version and report it.`;
    super(`${message}${message.endsWith(disclaimer) ? "" : disclaimer}`, options);
  }

  customCaptureExtraArgs = [
    {
      ...this.extraData,
      ...this.cause ? { cause: this.cause } : {},
    },
  ];
}
StackAssertionError.prototype.name = "StackAssertionError";


export type ErrorWithCustomCapture = {
  customCaptureExtraArgs: any[],
};

const errorSinks = new Set<(location: string, error: unknown, ...extraArgs: unknown[]) => void>();
export function registerErrorSink(sink: (location: string, error: unknown) => void): void {
  if (errorSinks.has(sink)) {
    return;
  }
  errorSinks.add(sink);
}
registerErrorSink((location, ...args) => {
  console.error(`\x1b[41mError in ${location}:`, ...args, "\x1b[0m");
});
registerErrorSink((location, error, ...extraArgs) => {
  globalVar.stackCapturedErrors = globalVar.stackCapturedErrors ?? [];
  globalVar.stackCapturedErrors.push({ location, error, extraArgs });
});

export function captureError(location: string, error: unknown): void {
  for (const sink of errorSinks) {
    sink(
      location,
      error,
      ...error && (typeof error === 'object' || typeof error === 'function') && "customCaptureExtraArgs" in error && Array.isArray(error.customCaptureExtraArgs) ? (error.customCaptureExtraArgs as any[]) : [],
    );
  }
}


type Status = {
  statusCode: number,
  message: string,
};

type StatusErrorConstructorParameters =
| [
  status: Status,
  message?: string
]
| [
  statusCode: number | Status,
  message: string,
];

export class StatusError extends Error {
  public name = "StatusError";
  public readonly statusCode: number;

  public static BadRequest = { statusCode: 400, message: "Bad Request" };
  public static Unauthorized = { statusCode: 401, message: "Unauthorized" };
  public static PaymentRequired = { statusCode: 402, message: "Payment Required" };
  public static Forbidden = { statusCode: 403, message: "Forbidden" };
  public static NotFound = { statusCode: 404, message: "Not Found" };
  public static MethodNotAllowed = { statusCode: 405, message: "Method Not Allowed" };
  public static NotAcceptable = { statusCode: 406, message: "Not Acceptable" };
  public static ProxyAuthenticationRequired = { statusCode: 407, message: "Proxy Authentication Required" };
  public static RequestTimeout = { statusCode: 408, message: "Request Timeout" };
  public static Conflict = { statusCode: 409, message: "Conflict" };
  public static Gone = { statusCode: 410, message: "Gone" };
  public static LengthRequired = { statusCode: 411, message: "Length Required" };
  public static PreconditionFailed = { statusCode: 412, message: "Precondition Failed" };
  public static PayloadTooLarge = { statusCode: 413, message: "Payload Too Large" };
  public static URITooLong = { statusCode: 414, message: "URI Too Long" };
  public static UnsupportedMediaType = { statusCode: 415, message: "Unsupported Media Type" };
  public static RangeNotSatisfiable = { statusCode: 416, message: "Range Not Satisfiable" };
  public static ExpectationFailed = { statusCode: 417, message: "Expectation Failed" };
  public static ImATeapot = { statusCode: 418, message: "I'm a teapot" };
  public static MisdirectedRequest = { statusCode: 421, message: "Misdirected Request" };
  public static UnprocessableEntity = { statusCode: 422, message: "Unprocessable Entity" };
  public static Locked = { statusCode: 423, message: "Locked" };
  public static FailedDependency = { statusCode: 424, message: "Failed Dependency" };
  public static TooEarly = { statusCode: 425, message: "Too Early" };
  public static UpgradeRequired = { statusCode: 426, message: "Upgrade Required" };
  public static PreconditionRequired = { statusCode: 428, message: "Precondition Required" };
  public static TooManyRequests = { statusCode: 429, message: "Too Many Requests" };
  public static RequestHeaderFieldsTooLarge = { statusCode: 431, message: "Request Header Fields Too Large" };
  public static UnavailableForLegalReasons = { statusCode: 451, message: "Unavailable For Legal Reasons" };

  public static InternalServerError = { statusCode: 500, message: "Internal Server Error" };
  public static NotImplemented = { statusCode: 501, message: "Not Implemented" };
  public static BadGateway = { statusCode: 502, message: "Bad Gateway" };
  public static ServiceUnavailable = { statusCode: 503, message: "Service Unavailable" };
  public static GatewayTimeout = { statusCode: 504, message: "Gateway Timeout" };
  public static HTTPVersionNotSupported = { statusCode: 505, message: "HTTP Version Not Supported" };
  public static VariantAlsoNegotiates = { statusCode: 506, message: "Variant Also Negotiates" };
  public static InsufficientStorage = { statusCode: 507, message: "Insufficient Storage" };
  public static LoopDetected = { statusCode: 508, message: "Loop Detected" };
  public static NotExtended = { statusCode: 510, message: "Not Extended" };
  public static NetworkAuthenticationRequired = { statusCode: 511, message: "Network Authentication Required" };


  constructor(...args: StatusErrorConstructorParameters);
  constructor(
    status: number | Status,
    message?: string,
  ) {
    if (typeof status === "object") {
      message ??= status.message;
      status = status.statusCode;
    }
    super(message);
    this.statusCode = status;
    if (!message) {
      throw new StackAssertionError("StatusError always requires a message unless a Status object is passed", {}, { cause: this });
    }
  }

  public isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  public isServerError() {
    return !this.isClientError();
  }

  public getStatusCode(): number {
    return this.statusCode;
  }

  public getBody(): Uint8Array {
    return new TextEncoder().encode(this.message);
  }

  public getHeaders(): Record<string, string[]> {
    return {
      "Content-Type": ["text/plain; charset=utf-8"],
    };
  }

  public toDescriptiveJson(): Json {
    return {
      status_code: this.getStatusCode(),
      message: this.message,
      headers: this.getHeaders(),
    };
  }

  /**
   * @deprecated this is not a good way to make status errors human-readable, use toDescriptiveJson instead
   */
  public toHttpJson(): Json {
    return {
      status_code: this.statusCode,
      body: this.message,
      headers: this.getHeaders(),
    };
  }
}
StatusError.prototype.name = "StatusError";
