import * as yup from 'yup';
import { NullishCoalesce } from './utils/types';
import { filterUndefined } from './utils/objects';

export type CrudOperation = "create" | "read" | "update" | "delete";

declare module 'yup' {
  export interface CustomSchemaMetadata {
    openapi?: {
      description?: string,
      exampleValue?: any,
      hide?: boolean,
    },
  }
}


type InnerCrudSchema<
  CreateSchema extends yup.Schema<any> | undefined = yup.Schema<any> | undefined,
  ReadSchema extends yup.Schema<any> | undefined = yup.Schema<any> | undefined,
  UpdateSchema extends yup.Schema<any> | undefined = yup.Schema<any> | undefined,
  DeleteSchema extends yup.Schema<any> | undefined = yup.Schema<any> | undefined,
> = {
  createSchema: CreateSchema,
  readSchema: ReadSchema,
  updateSchema: UpdateSchema,
  deleteSchema: DeleteSchema,
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
  clientCreateSchema?: yup.Schema<any>,
  clientReadSchema?: yup.Schema<any>,
  clientUpdateSchema?: yup.Schema<any>,
  clientDeleteSchema?: yup.Schema<any>,
  
  serverCreateSchema?: yup.Schema<any>,
  serverReadSchema?: yup.Schema<any>,
  serverUpdateSchema?: yup.Schema<any>,
  serverDeleteSchema?: yup.Schema<any>,

  adminCreateSchema?: yup.Schema<any>,
  adminReadSchema?: yup.Schema<any>,
  adminUpdateSchema?: yup.Schema<any>,
  adminDeleteSchema?: yup.Schema<any>,
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
  & (S['deleteSchema'] extends {} ? { Delete: yup.InferType<S['deleteSchema']> } : {});

export type CrudTypeOf<S extends CrudSchema> = {
  Client: InnerCrudTypeOf<S['client']>,
  Server: InnerCrudTypeOf<S['server']>,
  Admin: InnerCrudTypeOf<S['admin']>,
}

export function createCrud<O extends CrudSchemaCreationOptions>(options: O): CrudSchemaFromOptions<O> {
  const client = {
    createSchema: options.clientCreateSchema,
    readSchema: options.clientReadSchema,
    updateSchema: options.clientUpdateSchema,
    deleteSchema: options.clientDeleteSchema,
  };

  const serverOverrides = filterUndefined({
    createSchema: options.serverCreateSchema,
    readSchema: options.serverReadSchema,
    updateSchema: options.serverUpdateSchema,
    deleteSchema: options.serverDeleteSchema,
  });
  const server = {
    ...client,
    ...serverOverrides,
  };

  const adminOverrides = filterUndefined({
    createSchema: options.adminCreateSchema,
    readSchema: options.adminReadSchema,
    updateSchema: options.adminUpdateSchema,
    deleteSchema: options.adminDeleteSchema,
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
