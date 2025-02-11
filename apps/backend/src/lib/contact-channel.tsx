import { ContactChannelType } from "@prisma/client";
import { PrismaTransaction } from "./types";

const fullContactChannelInclude = {
  projectUser: {
    include: {
      authMethods: {
        include: {
          otpAuthMethod: true,
          passwordAuthMethod: true,
        }
      }
    }
  }
};

export async function getAuthContactChannel(
  tx: PrismaTransaction,
  options: {
    tenancyId: string,
    type: ContactChannelType,
    value: string,
  }
) {
  return await tx.contactChannel.findUnique({
    where: {
      tenancyId_type_value_usedForAuth: {
        tenancyId: options.tenancyId,
        type: options.type,
        value: options.value,
        usedForAuth: "TRUE",
      }
    },
    include: fullContactChannelInclude,
  });
}
