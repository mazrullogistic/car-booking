"use client";

import { MasterCrudPage } from "@/components/admin";
import { driversApi } from "@/lib/services";

type DriverRow = {
  id: number;
  name: string;
  mobile: string;
  license_number?: string;
};

export default function DriversPage() {
  return (
    <MasterCrudPage<DriverRow>
      title="Driver"
      description="Manage driver master data"
      searchPlaceholder="Search by name or mobile..."
      fetchList={(search) => driversApi.list({ search, limit: 100 })}
      onCreate={(values) =>
        driversApi.create({
          name: values.name,
          mobile: values.mobile,
          license_number: values.license_number || null,
        })
      }
      onUpdate={(id, values) =>
        driversApi.update(id, {
          name: values.name,
          mobile: values.mobile,
          license_number: values.license_number || null,
        })
      }
      onDelete={(id) => driversApi.remove(id)}
      fields={[
        { name: "name", label: "Driver Name", required: true },
        { name: "mobile", label: "Mobile", required: true },
        { name: "license_number", label: "License Number" },
      ]}
      columns={[
        { key: "name", header: "Driver Name", className: "font-medium" },
        { key: "mobile", header: "Mobile" },
        { key: "license_number", header: "License No." },
      ]}
    />
  );
}
