"use client";

import { MasterCrudPage } from "@/components/admin";
import { statesApi } from "@/lib/services";

type StateRow = { id: number; name: string };

export default function StatesPage() {
  return (
    <MasterCrudPage<StateRow>
      title="State"
      description="Manage state master data"
      searchPlaceholder="Search by state name..."
      fetchList={(search) => statesApi.list({ search, limit: 100 })}
      onCreate={(values) => statesApi.create({ name: values.name })}
      onUpdate={(id, values) => statesApi.update(id, { name: values.name })}
      onDelete={(id) => statesApi.remove(id)}
      fields={[{ name: "name", label: "State Name", required: true }]}
      columns={[{ key: "name", header: "State Name", className: "font-medium" }]}
    />
  );
}
