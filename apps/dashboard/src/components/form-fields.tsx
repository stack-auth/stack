"use client";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";


export function FieldLabel(props: {
  children?: React.ReactNode, 
  required?: boolean, 
  className?: string,
}) {
  return <FormLabel className={cn("flex", props.className)}>
    {props.children} 
    {props.required ? <span className="text-zinc-500">{'*'}</span> : null}
  </FormLabel>;
}

export function TextAreaField<F extends FieldValues>(props: {
  rows?: number,
  required?: boolean,
  placeholder?: string,
  helperText?: string | JSX.Element,
  control: Control<F>,
  name: Path<F>,
  label: React.ReactNode,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <label className="flex flex-col gap-2">
            <FieldLabel required={props.required}>{props.label}</FieldLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={props.rows}
                placeholder={props.placeholder}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </label>
        </FormItem>
      )}
    />
  );
}

export function InputField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>,
  label: React.ReactNode,
  placeholder?: string,
  required?: boolean,
  type?: string,
  disabled?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <label className="flex flex-col gap-2">
            <FieldLabel required={props.required}>{props.label}</FieldLabel>
            <FormControl>
              <Input
                {...field} 
                value={field.value ?? ""}
                placeholder={props.placeholder} 
                className="max-w-lg" 
                disabled={props.disabled} 
                type={props.type} 
              />
            </FormControl>
            <FormMessage />
          </label>
        </FormItem>
      )}
    />
  );
}

export function SwitchField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>, 
  label: React.ReactNode,
  required?: boolean,
  border?: boolean,
  disabled?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <label className={cn(
            "flex flex-row items-center gap-2",
            props.border ? "rounded-lg border p-3 shadow-sm" : null
          )}>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={props.disabled}
              />
            </FormControl>
            <FieldLabel required={props.required}>
              {props.label}
            </FieldLabel>
          </label>
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
  label: React.ReactNode,
  options: { value: string, label: string }[], 
  required?: boolean,
  disabled?: boolean,
}) {
  const Trigger = props.variant === "checkbox" ? Checkbox : Switch;

  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <div className="flex flex-col rounded-lg border p-3 shadow-sm space-y-4">
            {props.options.map(provider => (
              <label className="flex flex-row items-center justify-between" key={provider.value}>
                <FieldLabel required={props.required}>{provider.label}</FieldLabel>
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
                    disabled={props.disabled}
                  />
                </FormControl>
                <FormMessage />
              </label>
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
  label: React.ReactNode,
  required?: boolean,
  disabled?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FieldLabel required={props.required}>{props.label}</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={props.disabled}
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
                disabled={props.disabled}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField<F extends FieldValues>(props: {
  control: Control<F>,
  name: Path<F>,
  label: React.ReactNode,
  options: { value: string, label: string }[],
  placeholder?: string,
  required?: boolean,
  disabled?: boolean,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel required={props.required}>{props.label}</FieldLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={props.disabled}>
              <SelectTrigger className="max-w-lg">
                <SelectValue placeholder={props.placeholder}/>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {props.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
