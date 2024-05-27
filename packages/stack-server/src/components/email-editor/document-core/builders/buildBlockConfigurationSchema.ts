import { z } from 'zod';

import { BaseZodDictionary, BlockConfiguration, DocumentBlocksDictionary } from '..';

/**
 *
 * @param blocks Main DocumentBlocksDictionary
 * @returns zod schema that can parse arbitary objects into a single BlockConfiguration
 */
export default function buildBlockConfigurationSchema<T extends BaseZodDictionary>(
  blocks: DocumentBlocksDictionary<T>
) {
  const blockObjects = Object.keys(blocks).map((type: keyof T) =>
    z.object({
      type: z.literal(type),
      data: blocks[type].schema,
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return z.discriminatedUnion('type', blockObjects as any).transform((v) => v as BlockConfiguration<T>);
}
