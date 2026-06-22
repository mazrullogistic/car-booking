"use client";

import { MasterCrudPage } from "@/components/admin";
import { vendorsApi } from "@/lib/services";

type VendorRow = { id: number; name: string; mobile: string };

export default function VendorsPage() {
  return (
    <MasterCrudPage<VendorRow>
      title="Vendor"
      description="Manage vendor master data"
      searchPlaceholder="Search by name or mobile..."
      fetchList={(search) => vendorsApi.list({ search, limit: 100 })}
      onCreate={(values) =>
        vendorsApi.create({ name: values.name, mobile: values.mobile })
      }
      onUpdate={(id, values) =>
        vendorsApi.update(id, { name: values.name, mobile: values.mobile })
      }
      onDelete={(id) => vendorsApi.remove(id)}
      fields={[
        { name: "name", label: "Vendor Name", required: true },
        { name: "mobile", label: "Mobile", required: true },
      ]}
      columns={[
        { key: "name", header: "Vendor Name", className: "font-medium" },
        { key: "mobile", header: "Mobile" },
      ]}
    />
  );
}
