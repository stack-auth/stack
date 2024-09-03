/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as yup from 'yup';
import { NullishCoalesce } from './utils/types';
import { filterUndefined } from './utils/objects';

export type AccessType = "client" | "server" | "admin";
export type CrudOperation = "create" | "read" | "update" | "delete";
export type CrudlOperation = "create" | "read" | "update" | "delete" | "list";
export type AccessTypeXCrudOperation = `${AccessType}${Capitalize<CrudOperation>}`;
export type AccessTypeXCrudlOperation = `${AccessType}${Capitalize<CrudlOperation>}`;

declare module 'yup' {
  export interface CustomSchemaMetadata {
    openapiField?: {
      description?: string,
      exampleValue?: any,
      hidden?: boolean,
      onlyShowInOperations?: Capitalize<CrudlOperation>[],
    },
  }
}

type ShownEndpointDocumentation = {
  summary: string,
  description: string,
  tags?: string[],
  crudOperation?: Capitalize<CrudlOperation>,
};
export type EndpointDocumentation =
  | ({ hidden: true } & Partial<ShownEndpointDocumentation>)
  | ({ hidden?: boolean } & ShownEndpointDocumentation);


type InnerCrudSchema<
  CreateSchema extends yup.AnySchema | undefined = yup.AnySchema | undefined,
  ReadSchema extends yup.AnySchema | undefined = yup.AnySchema | undefined,
  UpdateSchema extends yup.AnySchema | undefined = yup.AnySchema | undefined,
  DeleteSchema extends yup.AnySchema | undefined = yup.AnySchema | undefined,
> = {
  createSchema: CreateSchema,
  createDocs: EndpointDocumentation | undefined,

  readSchema: ReadSchema,
  readDocs: EndpointDocumentation | undefined,
  listDocs: EndpointDocumentation | undefined,

  updateSchema: UpdateSchema,
  updateDocs: EndpointDocumentation | undefined,

  deleteSchema: DeleteSchema,
  deleteDocs: EndpointDocumentation | undefined,
};

export type CrudSchema<
  ClientSchema extends InnerCrudSchema = InnerCrudSchema,
  ServerSchema extends InnerCrudSchema = InnerCrudSchema,
  AdminSchema extends InnerCrudSchema = InnerCrudSchema,
> = {
  client: ClientSchema,
  server: ServerSchema,
  admin: AdminSchema,

  hasCreate: boolean,
  hasRead: boolean,
  hasUpdate: boolean,
  hasDelete: boolean,
};

export type CrudSchemaCreationOptions = {
  [K in AccessTypeXCrudOperation as `${K}Schema`]?: yup.AnySchema
};

type FillInOptionalsPrepareStep<O extends CrudSchemaCreationOptions> =
  & { [K in keyof Required<CrudSchemaCreationOptions>]: K extends keyof O ? O[K] : undefined };

type FillInOptionalsStep<O extends FillInOptionalsPrepareStep<CrudSchemaCreationOptions>> = {
  clientCreateSchema: NullishCoalesce<O['clientCreateSchema'], undefined>,
  clientReadSchema: NullishCoalesce<O['clientReadSchema'], undefined>,
  clientUpdateSchema: NullishCoalesce<O['clientUpdateSchema'], undefined>,
  clientDeleteSchema: NullishCoalesce<O['clientDeleteSchema'], undefined>,

  serverCreateSchema: NullishCoalesce<O['serverCreateSchema'], O['clientCreateSchema']>,
  serverReadSchema: NullishCoalesce<O['serverReadSchema'], O['clientReadSchema']>,
  serverUpdateSchema: NullishCoalesce<O['serverUpdateSchema'], O['clientUpdateSchema']>,
  serverDeleteSchema: NullishCoalesce<O['serverDeleteSchema'], O['clientDeleteSchema']>,

  adminCreateSchema: NullishCoalesce<O['adminCreateSchema'], O['serverCreateSchema']>,
  adminReadSchema: NullishCoalesce<O['adminReadSchema'], O['serverReadSchema']>,
  adminUpdateSchema: NullishCoalesce<O['adminUpdateSchema'], O['serverUpdateSchema']>,
  adminDeleteSchema: NullishCoalesce<O['adminDeleteSchema'], O['serverDeleteSchema']>,
};

type FillInOptionals<O extends CrudSchemaCreationOptions> = FillInOptionalsStep<FillInOptionalsStep<FillInOptionalsStep<FillInOptionalsPrepareStep<O>>>>;

type CrudSchemaFromOptionsInner<O extends FillInOptionals<any>> = CrudSchema<
  InnerCrudSchema<O['clientCreateSchema'], O['clientReadSchema'], O['clientUpdateSchema'], O['clientDeleteSchema']>,
  InnerCrudSchema<O['serverCreateSchema'], O['serverReadSchema'], O['serverUpdateSchema'], O['serverDeleteSchema']>,
  InnerCrudSchema<O['adminCreateSchema'], O['adminReadSchema'], O['adminUpdateSchema'], O['adminDeleteSchema']>
>;

export type CrudSchemaFromOptions<O extends CrudSchemaCreationOptions> = CrudSchemaFromOptionsInner<FillInOptionals<O>>;

type InnerCrudTypeOf<S extends InnerCrudSchema> =
  & (S['createSchema'] extends {} ? { Create: yup.InferType<S['createSchema']> } : {})
  & (S['readSchema'] extends {} ? { Read: yup.InferType<S['readSchema']> } : {})
  & (S['updateSchema'] extends {} ? { Update: yup.InferType<S['updateSchema']> } : {})
  & (S['deleteSchema'] extends {} ? { Delete: yup.InferType<S['deleteSchema']> } : {})
  & (S['readSchema'] extends {} ? { List: {
    items: yup.InferType<S['readSchema']>[],
    is_paginated: boolean,
  }, } : {});

export type CrudTypeOf<S extends CrudSchema> = {
  Client: InnerCrudTypeOf<S['client']>,
  Server: InnerCrudTypeOf<S['server']>,
  Admin: InnerCrudTypeOf<S['admin']>,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CrudDocsCreationOptions<SO extends CrudSchemaCreationOptions> = {
  [X in AccessTypeXCrudlOperation]?: EndpointDocumentation
};

export function createCrud<SO extends CrudSchemaCreationOptions>(options: SO & { docs?: CrudDocsCreationOptions<SO> }): CrudSchemaFromOptions<SO> {
  const docs = options.docs ?? {};
  const client = {
    createSchema: options.clientCreateSchema,
    createDocs: docs.clientCreate,

    readSchema: options.clientReadSchema,
    readDocs: docs.clientRead,
    listDocs: docs.clientList,

    updateSchema: options.clientUpdateSchema,
    updateDocs: docs.clientUpdate,

    deleteSchema: options.clientDeleteSchema,
    deleteDocs: docs.clientDelete,
  };

  const serverOverrides = filterUndefined({
    createSchema: options.serverCreateSchema,
    createDocs: docs.serverCreate,

    readSchema: options.serverReadSchema,
    readDocs: docs.serverRead,
    listDocs: docs.serverList,

    updateSchema: options.serverUpdateSchema,
    updateDocs: docs.serverUpdate,

    deleteSchema: options.serverDeleteSchema,
    deleteDocs: docs.serverDelete,
  });
  const server = {
    ...client,
    ...serverOverrides,
  };

  const adminOverrides = filterUndefined({
    createSchema: options.adminCreateSchema,
    createDocs: docs.adminCreate,

    readSchema: options.adminReadSchema,
    readDocs: docs.adminRead,
    listDocs: docs.adminList,

    updateSchema: options.adminUpdateSchema,
    updateDocs: docs.adminUpdate,

    deleteSchema: options.adminDeleteSchema,
    deleteDocs: docs.adminDelete,
  });
  const admin = {
    ...server,
    ...adminOverrides,
  };

  return {
    client: client as any,
    server: server as any,
    admin: admin as any,

    hasCreate: !!admin.createSchema,
    hasRead: !!admin.readSchema,
    hasUpdate: !!admin.updateSchema,
    hasDelete: !!admin.deleteSchema,
  };
}
