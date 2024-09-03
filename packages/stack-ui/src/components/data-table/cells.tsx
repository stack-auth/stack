"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SimpleTooltip,
  cn,
} from "../..";

export function TextCell(props: { children: React.ReactNode; size?: number; icon?: React.ReactNode }) {
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
    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  return (
    <div className="relative" style={{ minWidth: props.size }}>
      <div className="absolute inset-0 flex items-center gap-2">
        <div className={overflowStyle} ref={textRef}>
          {isOverflowing ? (
            <SimpleTooltip tooltip={props.children}>
              <div className={overflowStyle}>{props.children}</div>
            </SimpleTooltip>
          ) : (
            props.children
          )}
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

export function DateCell(props: { date: Date; ignoreAfterYears?: number }) {
  const ignore =
    !!props.ignoreAfterYears && new Date(new Date().setFullYear(new Date().getFullYear() + props.ignoreAfterYears)) < props.date;
  const timeString = props.date.toLocaleTimeString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return <TextCell size={140}>{ignore ? "Never" : timeString}</TextCell>;
}

type ActionItem =
  | "-"
  | {
      item: React.ReactNode;
      onClick: (e: React.MouseEvent) => void | Promise<void>;
      danger?: boolean;
    };

export function ActionCell(props: { items?: ActionItem[]; invisible?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("data-[state=open]:bg-muted flex h-8 w-8 p-0", props.invisible && "invisible")}>
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {props.items?.map((item, index) =>
          item === "-" ? (
            <DropdownMenuSeparator key={index} />
          ) : (
            <DropdownMenuItem key={index} onClick={item.onClick} className={item.danger ? "text-destructive" : ""}>
              {item.item}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BadgeCell(props: { badges: string[]; size?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {props.badges.map((badge, index) => (
        <Badge key={index} variant="secondary">
          {badge}
        </Badge>
      ))}
    </div>
  );
}
