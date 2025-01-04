import { deindent, indentExceptFirstLine } from "@stackframe/stack-shared/dist/utils/strings";

export class DurablesError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DurablesError';
  }
}

export function createDurablesError(strings: TemplateStringsArray, ...args: any[]) {
  const message = indentExceptFirstLine(deindent(strings, ...args), "    ") + "\n";
  return (options?: ErrorOptions & { errorClass?: typeof DurablesError }) => new (options?.errorClass ?? DurablesError)(message, options);
}
