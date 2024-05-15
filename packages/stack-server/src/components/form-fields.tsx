"use client";;
import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";


export function Label({ required, children }: { children?: React.ReactNode, required?: boolean }) {
  return <FormLabel>{children} {required ? <span className="text-sm text-zinc-500">{' *'}</span> : null}</FormLabel>;
}


export function InputField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>,
  label: string, 
  placeholder?: string,
  required?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <Label required={props.required}>{props.label}</Label>
          <FormControl>
            <Input {...field} placeholder={props.placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>, 
  label: string,
  required?: boolean,
  noCard?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <div className={cn(
            "flex flex-row items-center justify-between p-2 gap-2",
            props.noCard ? "" : "rounded-lg border p-3 shadow-sm"
          )}>
            <Label required={props.required}>{props.label}</Label>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SmallSwitchField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>, 
  label: string,
  required?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <Label required={props.required}>{props.label}</Label>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchListField<F extends FieldValues>(props: { 
  variant?: "switch" | "checkbox",
  control: Control<F>, 
  name: Path<F>, 
  label: string, 
  options: { value: string, label: string }[], 
  required?: boolean,
}) {
  const Trigger = props.variant === "checkbox" ? Checkbox : Switch;

  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <div className="flex-col rounded-lg border p-3 shadow-sm space-y-4">
            {props.options.map(provider => (
              <div className="flex flex-row items-center justify-between" key={provider.value}>
                <Label required={props.required}>{provider.label}</Label>
                <FormControl>
                  <Trigger
                    checked={field.value.includes(provider.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, provider.value]);
                      } else {
                        field.onChange(field.value.filter((v: any) => v !== provider.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </div>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}

export function DateField<F extends FieldValues>(props: {
  control: Control<F>,
  name: Path<F>,
  label: string,
  required?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <Label required={props.required}>{props.label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? field.value.toLocaleDateString() : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}