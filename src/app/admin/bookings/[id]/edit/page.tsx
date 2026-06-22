"use client";

import { use } from "react";
import { BookingForm } from "@/components/admin/BookingForm";

export default function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BookingForm bookingId={Number(id)} />;
}
