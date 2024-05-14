
'use client';;
import React from "react";
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


export function TextCell(props: { children: React.ReactNode, size: number }) {
  return (
    <div className="text-ellipsis text-nowrap overflow-x-hidden" style={{ width: props.size }}>
      {props.children}
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

export function DateCell(props: { date: Date }) {
  return (
    <TextCell size={140}>
      {props.date.toLocaleTimeString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
    </TextCell>
  );
}

type ActionItem = {
  item: React.ReactNode,
  onClick: (e: React.MouseEvent) => void,
}

export function ActionCell(props: {
  items?: ActionItem[],
  dangerItems?: ActionItem[],
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {props.items?.map((item, index) => (
          <DropdownMenuItem key={index} onClick={item.onClick}>
            {item.item}
          </DropdownMenuItem>
        ))}
        {props.items && props.dangerItems && <DropdownMenuSeparator />}
        {props.dangerItems?.map((item, index) => (
          <DropdownMenuItem key={index} className="text-destructive" onClick={item.onClick}>
            {item.item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BadgeCell(props: { badges: string[] }) {
  return (
    <div className="flex items-center space-x-1">
      {props.badges.map((badge, index) => (
        <Badge key={index} variant="outline">{badge}</Badge>
      ))}
    </div>
  );
}