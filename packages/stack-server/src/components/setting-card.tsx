import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export function SettingCard(props: {
  title: string,
  description?: string,
  actions?: React.ReactNode,
  children?: React.ReactNode,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        {props.description && <CardDescription>{props.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {props.children}
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-end">
          {props.actions}
        </div>
      </CardFooter>
    </Card>
  );
}
