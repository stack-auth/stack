import { Card, CardContent, CardProps } from "@mui/joy";
import { Paragraph } from "./paragraph";

export function SimpleCard({ children, title, ...cardProps }: React.PropsWithChildren<CardProps>) {
  return (
    <Card {...cardProps}>
      <CardContent sx={{ display: "block" }}>
        {title && (
          <Paragraph h2 sx={{ mt: 0 }}>
            {title}
          </Paragraph>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
