import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"


export function Hero(props: {
  capsuleText: string,
  capsuleLink: string,
  title: string,
  subtitle: string,
  primaryCtaText: string,
  primaryCtaLink: string,
  secondaryCtaText: string,
  secondaryCtaLink: string,
}) {
  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-64">
    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
      <Link
        href={props.capsuleLink}
        className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
        target="_blank"
      >
        {props.capsuleText}
      </Link>
      <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
        {props.title}
      </h1>
      <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
        {props.subtitle}
      </p>
      <div className="space-x-4">
        <Link href={props.primaryCtaLink} className={cn(buttonVariants({ size: "lg" }))}>
          {props.primaryCtaText}
        </Link>
        <Link
          href={props.secondaryCtaLink}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          {props.secondaryCtaText}
        </Link>
      </div>
    </div>
  </section>
  )
}