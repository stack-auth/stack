"use client";;
import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function InputField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>,
  label: string, 
  placeholder?: string,
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
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
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>{props.label}</FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
}

export function ListSwitchField<F extends FieldValues>(props: { 
  control: Control<F>, 
  name: Path<F>, 
  label: string, 
  options: { value: string, label: string }[], 
}) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <div className="flex-col rounded-lg border p-3 shadow-sm space-y-2">
            {props.options.map(provider => (
              <div className="flex flex-row items-center justify-between" key={provider.value}>
                <div className="space-y-0.5">
                  <FormLabel>{provider.label}</FormLabel>
                </div>
                <FormControl>
                  <Switch
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
              </div>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}