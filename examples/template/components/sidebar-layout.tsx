"use client";

import { cn } from "@/lib/utils";
import { UserButton } from "@stackframe/stack";
import { LucideIcon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button, buttonVariants } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ColorModeSwitcher } from "./color-mode-switcher";

type BreadcrumbItem = { item: React.ReactNode; href: string };

type Item = {
  name: React.ReactNode;
  href: string;
  icon: LucideIcon;
  type: "item";
};

type Label = {
  name: React.ReactNode;
  type: "label";
};

export type SidebarItem = Item | Label;

function NavItem({
  item,
  href,
  onClick,
}: {
  item: Item;
  href: string;
  onClick?: () => void;
}) {
  const segment = useSelectedLayoutSegment();
  const selected = segment === href;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        selected && "bg-muted",
        "flex-grow justify-start text-md text-zinc-800 dark:text-zinc-300 px-2"
      )}
      onClick={onClick}
      prefetch={true}
    >
      <item.icon className="mr-2 h-4 w-4" />
      {item.name}
    </Link>
  );
}

function SidebarContent(props: {
  onNavigate?: () => void;
  items: SidebarItem[];
}) {
  const path = usePathname();

  return (
    <div className="flex flex-col h-full items-stretch">
      <div className="h-14 border-b flex items-center px-2 shrink-0">asdf</div>
      <div className="flex flex-grow flex-col gap-1 pt-2 overflow-y-auto">
        {props.items.map((item, index) => {
          if (item.type === "label") {
            return (
              <p
                key={index}
                className="pl-2 mt-3 mb-1 text-zinc-500 dark:text-zinc-400"
              >
                {item.name}
              </p>
            );
          } else if (item.type === "item") {
            return (
              <div key={index} className="flex px-2">
                <NavItem
                  item={item}
                  onClick={props.onNavigate}
                  href={path.split("/").slice(0, -1).join("/") + item.href}
                />
              </div>
            );
          }
        })}

        <div className="flex-grow" />
      </div>
    </div>
  );
}

export type HeaderBreadcrumbItem = { title: string; href: string };

function HeaderBreadcrumb(props: { baseBreadcrumb?: HeaderBreadcrumbItem[] }) {
  const segment = useSelectedLayoutSegment();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {props.baseBreadcrumb?.map((item, index) => (
          <>
            <BreadcrumbItem key={index}>
              <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator key={`separator-${index}`} />
          </>
        ))}

        <BreadcrumbItem>
          <BreadcrumbPage>{segment}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function SidebarLayout(props: {
  children?: React.ReactNode;
  baseBreadcrumb?: HeaderBreadcrumbItem[];
  items: SidebarItem[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="w-full flex">
      <div className="flex-col border-r w-[240px] h-screen sticky top-0 hidden md:flex">
        <SidebarContent items={props.items} />
      </div>
      <div className="flex flex-col flex-grow w-0">
        <div className="h-14 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-black z-5 px-4 md:px-6">
          <div className="hidden md:flex">
            <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} />
          </div>

          <div className="flex md:hidden items-center">
            <Sheet
              onOpenChange={(open) => setSidebarOpen(open)}
              open={sidebarOpen}
            >
              <SheetTrigger>
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <SidebarContent
                  onNavigate={() => setSidebarOpen(false)}
                  items={props.items}
                />
              </SheetContent>
            </Sheet>

            <div className="ml-4 flex md:hidden">
              <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} />
            </div>
          </div>

          <UserButton
            colorModeToggle={() =>
              setTheme(resolvedTheme === "light" ? "dark" : "light")
            }
          />
        </div>
        <div className="flex-grow">{props.children}</div>
      </div>
    </div>
  );
}
