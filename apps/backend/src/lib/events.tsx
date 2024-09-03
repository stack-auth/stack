import { urlSchema, yupMixed, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { HTTP_METHODS } from "@stackframe/stack-shared/dist/utils/http";
import * as yup from "yup";
import { UnionToIntersection } from "@stackframe/stack-shared/dist/utils/types";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { prismaClient } from "@/prisma-client";
import withPostHog from "@/analytics";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";

type EventType = {
  id: string,
  dataSchema: yup.Schema<any>,
  inherits: EventType[],
};

type SystemEventTypeBase = EventType & {
  id: `$${string}`,
};

const LegacyApiEventType = {
  id: "$legacy-api",
  dataSchema: yupObject({}),
  inherits: [],
} as const satisfies SystemEventTypeBase;

const ProjectEventType = {
  id: "$project",
  dataSchema: yupObject({
    projectId: yupString().required(),
  }),
  inherits: [],
} as const satisfies SystemEventTypeBase;

const ProjectActivityEventType = {
  id: "$project-activity",
  dataSchema: yupObject({}),
  inherits: [ProjectEventType],
} as const satisfies SystemEventTypeBase;

const UserActivityEventType = {
  id: "$user-activity",
  dataSchema: yupObject({
    userId: yupString().uuid().required(),
  }),
  inherits: [ProjectActivityEventType],
} as const satisfies SystemEventTypeBase;

const ApiRequestEventType = {
  id: "$api-request",
  dataSchema: yupObject({
    method: yupString().oneOf(HTTP_METHODS).required(),
    url: urlSchema.required(),
    body: yupMixed().nullable().optional(),
    headers: yupObject().required(),
  }),
  inherits: [
    ProjectEventType,
  ],
} as const satisfies SystemEventTypeBase;

export const SystemEventTypes = stripEventTypeSuffixFromKeys({
  ProjectEventType,
  ProjectActivityEventType,
  UserActivityEventType,
  ApiRequestEventType,
  LegacyApiEventType,
} as const);
const systemEventTypesById = new Map(Object.values(SystemEventTypes).map(eventType => [eventType.id, eventType]));

function stripEventTypeSuffixFromKeys<T extends Record<`${string}EventType`, unknown>>(t: T): { [K in keyof T as K extends `${infer Key}EventType` ? Key : never]: T[K] } {
  return Object.fromEntries(Object.entries(t).map(([key, value]) => [key.replace(/EventType$/, ""), value])) as any;
}

type DataOfMany<T extends EventType[]> = UnionToIntersection<T extends unknown ? DataOf<T[number]> : never>;  // distributive conditional. See: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types

type DataOf<T extends EventType> =
  & yup.InferType<T["dataSchema"]>
  & DataOfMany<T["inherits"]>;

export async function logEvent<T extends EventType[]>(
  eventTypes: T,
  data: DataOfMany<T>,
  options: {
    time?: Date | { start: Date, end: Date },
  } = {}
) {
  const timeOrTimeRange = options.time ?? new Date();
  const timeRange = "start" in timeOrTimeRange && "end" in timeOrTimeRange ? timeOrTimeRange : { start: timeOrTimeRange, end: timeOrTimeRange };
  const isWide = timeOrTimeRange === timeRange;

  // assert all event types are valid
  for (const eventType of eventTypes) {
    if (eventType.id.startsWith("$")) {
      if (!systemEventTypesById.has(eventType.id as any)) {
        throw new StackAssertionError(`Invalid system event type: ${eventType.id}`, { eventType });
      }
    } else {
      throw new StackAssertionError(`Non-system event types are not supported yet`, { eventType });
    }
  }


  // select all events in the inheritance chain
  const allEventTypes = new Set<EventType>();
  const addEventType = (eventType: EventType) => {
    if (allEventTypes.has(eventType)) {
      return;
    }
    allEventTypes.add(eventType);
    eventType.inherits.forEach(addEventType);
  };
  eventTypes.forEach(addEventType);


  // validate & transform data
  const originalData = data;
  for (const eventType of allEventTypes) {
    try {
      data = await eventType.dataSchema.validate(data, { strict: true, stripUnknown: false });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw new StackAssertionError(`Invalid event data for event type: ${eventType.id}`, { eventType, data, error, originalData, originalEventTypes: eventTypes }, { cause: error });
      }
      throw error;
    }
  }


  // log event in DB
  await prismaClient.event.create({
    data: {
      systemEventTypeIds: [...allEventTypes].map(eventType => eventType.id),
      data: data as any,
      isWide,
      eventStartedAt: timeRange.start,
      eventEndedAt: timeRange.end,
    },
  });

  // log event in PostHog
  await withPostHog(async posthog => {
    const distinctId = typeof data === "object" && data && "userId" in data ? (data.userId as string) : `backend-anon-${generateUuid()}`;
    for (const eventType of allEventTypes) {
      const postHogEventName = `stack_${eventType.id.replace(/^\$/, "system_").replace(/-/g, "_")}`;
      posthog.capture({
        event: postHogEventName,
        distinctId,
        groups: filterUndefined({
          projectId: typeof data === "object" && data && "projectId" in data ? (typeof data.projectId === "string" ? data.projectId : throwErr("Project ID is not a string for some reason?", { data })) : undefined,
        }),
        timestamp: timeRange.end,
        properties: {
          data,
          is_wide: isWide,
          event_started_at: timeRange.start,
          event_ended_at: timeRange.end,
        },
      });
    }
  });
}
