"use client";;
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, FieldValues, Path, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Text } from "@stackframe/stack";

const projectFormSchema = z.object({
  displayName: z.string({ required_error: "Please enter a project name." }),
  description: z.string(),
  signInMethods: z.array(z.enum(["google", "github", "microsoft", "facebook", "credential", "magicLink"])),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>

const defaultValues: Partial<ProjectFormValues> = {
  displayName: "",
  description: "",
  signInMethods: ["credential", "magicLink", "google", "github"],
};

function SwitchField<F extends FieldValues>(props: { 
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
};

function InputField<F extends FieldValues>(props: { 
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

function ListSwitchField<F extends FieldValues>(props: { 
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

export function ProjectForm() {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ProjectFormValues) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <div className="flex justify-center mb-4">
        <Text size="xl" as='h2' className="font-bold">Create a new project</Text>
      </div>
      <form onSubmit={() => form.handleSubmit(onSubmit)} className="space-y-6">

        <InputField control={form.control} name="displayName" label="Project Name" placeholder="My Project" />
        <InputField control={form.control} name="description" label="Description" placeholder="A short description of your project" />

        <ListSwitchField
          control={form.control}
          name="signInMethods"
          label="Sign-In Methods"
          options={[
            { value: "credential", label: "Email password" },
            { value: "magicLink", label: "Magic link" },
            { value: "google", label: "Google" },
            { value: "github", label: "GitHub" },
            { value: "microsoft", label: "Microsoft" },
            { value: "facebook", label: "Facebook" },
          ]}
        />

        <div className="flex justify-center">
          <Button type="submit" size='lg'>Create project</Button>
        </div>
      </form>
    </Form>
  );
}