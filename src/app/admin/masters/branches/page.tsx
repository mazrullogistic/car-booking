"use client";

import { MasterCrudPage } from "@/components/admin";
import { branchesApi } from "@/lib/services";

type BranchRow = { id: number; name: string; tenant_id?: number };

export default function BranchesPage() {
  return (
    <MasterCrudPage<BranchRow>
      title="Branch"
      description="Manage branch locations"
      searchPlaceholder="Search by branch name..."
      fetchList={(search) => branchesApi.list({ search, limit: 100 })}
      onCreate={(values) =>
        branchesApi.create({ name: values.name, tenant_id: 1 })
      }
      onUpdate={(id, values) => branchesApi.update(id, { name: values.name })}
      onDelete={(id) => branchesApi.remove(id)}
      fields={[{ name: "name", label: "Branch Name", required: true }]}
      columns={[{ key: "name", header: "Branch Name", className: "font-medium" }]}
    />
  );
}
