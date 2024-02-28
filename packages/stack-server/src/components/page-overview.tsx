import { Box } from "@mui/joy";
import { useCallback, useRef, useState } from "react";
import { throwErr } from "stack-shared/dist/utils/errors";
import { deepPlainEquals } from "stack-shared/dist/utils/objects";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

type Level = 1 | 2 | 3 | 4 | 5 | 6;
function isLevel(level: number): level is Level {
  return level >= 1 && level <= 6 && Number.isInteger(level);
}

type Section = {
  id: string,
  element: HTMLHeadingElement,
  level: Level,
  subSections: Section[],
};

export type Overview = {
  sections: Section[],
  container: HTMLElement,
};

export function PageOverview(props: { children: React.ReactNode, onOverviewChange: (overview: Overview) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [lastOverview, setLastOverview] = useState<Overview | null>(null);

  const mutationCallback = useCallback((mutations: MutationRecord[] | "init") => {
    const node = ref?.current ?? throwErr("mutation callback should never be called when ref is null!");
    const headings = [...node.querySelectorAll("h1, h2, h3, h4, h5, h6")] as HTMLHeadingElement[];
    const headingsWithId = headings.filter((heading) => !!heading.id);
  
    const sections: Section[] = [];
    for (const heading of headingsWithId) {
      const headingLevel = parseInt(heading.tagName[1]);
      if (!isLevel(headingLevel)) throwErr("Invalid heading tag name " + heading.tagName);
      
      let curSections = sections;
      while (curSections.length > 0) {
        const lastSection = curSections[curSections.length - 1];
        if (lastSection.level < headingLevel) {
          curSections = lastSection.subSections;
        } else {
          break;
        }
      }
      curSections.push({
        id: heading.id,
        element: heading,
        level: headingLevel,
        subSections: [],
      });
    }

    const overview = {
      container: node,
      sections,
    };

    if (!deepPlainEquals(overview, lastOverview)) {
      setLastOverview(overview);
      props.onOverviewChange(overview);
    }
  }, [lastOverview, props]);

  useMutationObserver(
    ref,
    mutationCallback,
    {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ["id"],
    }
  );

  return (
    <Box ref={ref}>
      {props.children}
    </Box>
  );
}
