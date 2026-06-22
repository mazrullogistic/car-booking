"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { Card } from "./Card";
import { PageHeader } from "./PageHeader";

interface FormPageProps {
  title: string;
  description?: string;
  backHref: string;
  children: ReactNode;
}

export function FormPage({
  title,
  description,
  backHref,
  children,
}: FormPageProps) {
  return (
    <>
      <PageHeader title={title} description={description}>
        <Link href={backHref}>
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>
      <Card className="max-w-3xl">{children}</Card>
    </>
  );
}
