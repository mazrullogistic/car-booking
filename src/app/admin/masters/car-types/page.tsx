"use client";

import { MasterCrudPage } from "@/components/admin";
import { carTypesApi } from "@/lib/services";

type CarTypeRow = { id: number; name: string };

export default function CarTypesPage() {
  return (
    <MasterCrudPage<CarTypeRow>
      title="Car Type"
      description="Manage car type master data"
      searchPlaceholder="Search by car type..."
      fetchList={(search) => carTypesApi.list({ search, limit: 100 })}
      onCreate={(values) => carTypesApi.create({ name: values.name })}
      onUpdate={(id, values) => carTypesApi.update(id, { name: values.name })}
      onDelete={(id) => carTypesApi.remove(id)}
      fields={[{ name: "name", label: "Car Type Name", required: true }]}
      columns={[{ key: "name", header: "Car Type", className: "font-medium" }]}
    />
  );
}
