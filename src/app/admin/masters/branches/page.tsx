"use client";

import { useEffect, useState } from "react";
import { MasterCrudPage } from "@/components/admin";
import { getCurrentUser } from "@/lib/auth";
import { branchesApi } from "@/lib/services";

type BranchRow = { id: number; name: string; tenant_id?: number };

export default function BranchesPage() {
  const [tenantId, setTenantId] = useState(1);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.tenant?.id) setTenantId(user.tenant.id);
    });
  }, []);

  return (
    <MasterCrudPage<BranchRow>
      title="Branch"
      description="Manage branch locations"
      searchPlaceholder="Search by branch name..."
      fetchList={(search) => branchesApi.list({ search, limit: 100 })}
      onCreate={(values) =>
        branchesApi.create({ name: values.name, tenant_id: tenantId })
      }
      onUpdate={(id, values) => branchesApi.update(id, { name: values.name })}
      onDelete={(id) => branchesApi.remove(id)}
      fields={[{ name: "name", label: "Branch Name", required: true }]}
      columns={[{ key: "name", header: "Branch Name", className: "font-medium" }]}
    />
  );
}
