import { Popover, PopoverTrigger, PopoverContent, useUser } from "..";

export default function UserButton({
  height=40,
}: {
  height?: number,
}) {
  const user = useUser();
  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger>
        <div style={{ display: 'flex', alignItems: 'center', height, padding: '0.25rem' }}>
          <img src={user.profileImageUrl || ''} style={{ borderRadius: 100, height: '100%' }} />
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          <div>{user?.displayName}</div>
          <div>{user?.primaryEmail}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}