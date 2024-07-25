
'use client';
import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/simple-tooltip";

export function TextCell(props: { children: React.ReactNode, size?: number, icon?: React.ReactNode }) {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const overflowStyle = "text-ellipsis text-nowrap overflow-x-hidden";

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, []);

  return (
    <div className="relative" style={{ minWidth: props.size }}>
      <div className="flex items-center gap-2 absolute inset-0">
        <div className={overflowStyle} ref={textRef}>
          {isOverflowing ? (
            <SimpleTooltip tooltip={props.children}>
              <div className={overflowStyle}>
                {props.children}
              </div>
            </SimpleTooltip>
          ) : props.children}
        </div>
        {props.icon && <div>{props.icon}</div>}
      </div>
    </div>
  );
}

export function AvatarCell(props: { src?: string }) {
  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={props.src} />
    </Avatar>
  );
}

export function DateCell(props: { date: Date, ignoreAfterYears?: number }) {
  const ignore = !!props.ignoreAfterYears && new Date(new Date().setFullYear(new Date().getFullYear() + props.ignoreAfterYears)) < props.date;
  const timeString = props.date.toLocaleTimeString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'});
  return (
    <TextCell size={140}>
      {ignore ? 'Never' : timeString}
    </TextCell>
  );
}

type ActionItem = '-' | {
  item: React.ReactNode,
  onClick: (e: React.MouseEvent) => void | Promise<void>,
  danger?: boolean,
}

export function ActionCell(props: {
  items?: ActionItem[],
  /**
   * @deprecated use `items: [{ danger: true }]` instead
   */
  dangerItems?: ActionItem[],
  invisible?: boolean,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex h-8 w-8 p-0 data-[state=open]:bg-muted",
            props.invisible && "invisible",
          )}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {props.items?.map((item, index) => item === '-' ? (
          <DropdownMenuSeparator key={index} />
        ) : (
          <DropdownMenuItem key={index} onClick={item.onClick} className={item.danger ? "text-destructive" : ""}>
            {item.item}
          </DropdownMenuItem>
        ))}
        {props.items && props.dangerItems && <DropdownMenuSeparator />}
        <div className="text-destructive">
          {props.dangerItems?.map((item, index) => item === '-' ? (
            <DropdownMenuSeparator key={index} />
          ) : (
            <DropdownMenuItem key={index} onClick={item.onClick}>
              {item.item}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BadgeCell(props: { badges: string[], size?: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {props.badges.map((badge, index) => (
        <Badge key={index} variant="secondary">{badge}</Badge>
      ))}
    </div>
  );
}
