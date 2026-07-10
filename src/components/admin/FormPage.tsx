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
        <Link href={backHref} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Back
          </Button>
        </Link>
      </PageHeader>
      <Card className="w-full max-w-6xl">{children}</Card>
    </>
  );
}
