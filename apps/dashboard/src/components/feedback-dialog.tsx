import { useUser } from "@stackframe/stack";
import * as yup from "yup";
import { SmartFormDialog } from "./form-dialog";
import { useToast } from "@stackframe/stack-ui";

export function FeedbackDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
}) {
  const user = useUser();
  const { toast } = useToast();

  const domainFormSchema = yup.object({

    name: yup.string()
      .optional()
      .label("Your name")
      .default(user?.displayName),
    email: yup.string()
      .email("Invalid email")
      .required("Email is required")
      .label("Your email")
      .default(user?.primaryEmail),
    message: yup.string()
      .required("Message is required")
      .label("Message")
      .meta({ type: "textarea" }),
  });

  return <SmartFormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title={"Send feedback"}
    formSchema={domainFormSchema}
    okButton={{ label: "Send" }}
    onSubmit={async (values) => {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...values,
          type: "feedback",
          // This is the public access key, so no worries
          access_key: '4f0fc468-c066-4e45-95c1-546fd652a44a',
        }, null, 2),
      });
      toast({
        title: "Feedback sent",
        description: "We'll get back to you soon",
      });
    }}
  />;
}