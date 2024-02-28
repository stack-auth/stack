import { Button, Input, InputProps } from "@mui/joy";
import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";

export function SiteSearch(props: InputProps) {
  const [searchText, setSearchText] = useState('');

  const { ...inputProps } = props;

  const openSearch = useCallback(() => {
    const baseUrl = new URL(process.env.__NEXT_ROUTER_BASEPATH || "", window.location.origin);
    // Let's strip away all information but the necessary (Google search doesn't support eg. port number)
    const baseSite = `${baseUrl.hostname}${baseUrl.pathname}`;
  
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`${searchText} site:${baseSite}`)}`, '_blank');
  }, [searchText]);

  return (
    <Input
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
      placeholder="Search"
      startDecorator={<Icon icon="search" sx={{
        color: theme => theme.palette.primary[500],
      }} />}
      endDecorator={
        <Button size="sm" color="primary" variant="solid" onClick={() => openSearch()}>
          Go
        </Button>
      }
      {...inputProps}
      sx={{
        '&:not(:focus-within) button:not(:active)': {
          display: 'none',
        },
        ...inputProps.sx ?? {},
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          openSearch();
        }
      }}
    />
  );
}
