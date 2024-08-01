import { SiteLoadingIndicator } from "@/components/site-loading-indicator";
import { Alert } from "@/components/ui/alert";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";

type Pagination = {
  hasPrevPage?: boolean,
  hasNextPage?: boolean,
  prevPage?: () => void,
  nextPage?: () => void,
}

export function getSvixResult<D>(data: {
  loading: boolean,
  error: any,
  data: D,
} & Pagination): { loaded: true, data: NonNullable<D> } & Pagination | { loaded: false, rendered: JSX.Element } & Pagination {
  if (data.error) {
    return {
      loaded: false,
      rendered: <Alert>An error has occurred</Alert>,
    };
  }

  if (data.loading || !data.data) {
    return {
      loaded: false,
      rendered: <SiteLoadingIndicator />,
    };
  }

  return {
    loaded: true,
    data: data.data,
  };
}