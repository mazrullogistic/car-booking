"use client";

import { use } from "react";
import { AssignCarForm } from "@/components/admin/AssignCarForm";

export default function AssignCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AssignCarForm bookingId={Number(id)} />;
}
