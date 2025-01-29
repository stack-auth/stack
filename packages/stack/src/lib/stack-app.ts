import {
  StackAdminApp as JSStackAdminApp,
  StackAdminAppConstructor as JSStackAdminAppConstructor,
  StackAdminAppConstructorOptions as JSStackAdminAppConstructorOptions,
  StackAdminApp as JSStackAdminAppType,
  StackClientApp as JSStackClientApp,
  StackClientAppConstructor as JSStackClientAppConstructor,
  StackClientAppConstructorOptions as JSStackClientAppConstructorOptions,
  StackClientApp as JSStackClientAppType,
  StackServerApp as JSStackServerApp,
  StackServerAppConstructor as JSStackServerAppConstructor,
  StackServerAppConstructorOptions as JSStackServerAppConstructorOptions,
  StackServerApp as JSStackServerAppType,
} from "@stackframe/js";

export * from "@stackframe/js";

type StackClientAppOmittedOptions<HasTokenStore extends boolean, ProjectId extends string> =
  Omit<JSStackClientAppConstructorOptions<HasTokenStore, ProjectId>, "redirectMethod">;

export type StackClientAppConstructor = Omit<JSStackClientAppConstructor, "new"> & {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackClientAppOmittedOptions<HasTokenStore, ProjectId>): JSStackClientAppType<HasTokenStore, ProjectId>,
  new (options: StackClientAppOmittedOptions<boolean, string>): JSStackClientAppType<boolean, string>,
};

export const StackClientApp: StackClientAppConstructor = new Proxy(JSStackClientApp, {
  construct(Target, [options], NewTarget) {
    return Reflect.construct(Target, [{ ...options, redirectMethod: "nextjs" }], NewTarget);
  },
});
export type StackClientApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = JSStackClientAppType<HasTokenStore, ProjectId>;

type StackServerAppOmittedOptions<HasTokenStore extends boolean, ProjectId extends string> =
  Omit<JSStackServerAppConstructorOptions<HasTokenStore, ProjectId>, "redirectMethod">;

export type StackServerAppConstructor = Omit<JSStackServerAppConstructor, "new"> & {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackServerAppOmittedOptions<HasTokenStore, ProjectId>): JSStackServerAppType<HasTokenStore, ProjectId>,
  new (options: StackServerAppOmittedOptions<boolean, string>): JSStackServerAppType<boolean, string>,
};

export const StackServerApp: StackServerAppConstructor = new Proxy(JSStackServerApp, {
  construct(Target, [options], NewTarget) {
    return Reflect.construct(Target, [{ ...options, redirectMethod: "nextjs" }], NewTarget);
  },
});
export type StackServerApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = JSStackServerAppType<HasTokenStore, ProjectId>;

type StackAdminAppOmittedOptions<HasTokenStore extends boolean, ProjectId extends string> =
  Omit<JSStackAdminAppConstructorOptions<HasTokenStore, ProjectId>, "redirectMethod">;

export type StackAdminAppConstructor = Omit<JSStackAdminAppConstructor, "new"> & {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackAdminAppOmittedOptions<HasTokenStore, ProjectId>): JSStackAdminAppType<HasTokenStore, ProjectId>,
  new (options: StackAdminAppOmittedOptions<boolean, string>): JSStackAdminAppType<boolean, string>,
};

export const StackAdminApp: StackAdminAppConstructor = new Proxy(JSStackAdminApp, {
  construct(Target, [options], NewTarget) {
    return Reflect.construct(Target, [{ ...options, redirectMethod: "nextjs" }], NewTarget);
  },
});
export type StackAdminApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = JSStackAdminAppType<HasTokenStore, ProjectId>;
