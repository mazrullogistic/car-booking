"use client";

import { MasterCrudPage } from "@/components/admin";
import { customersApi } from "@/lib/services";

type CustomerRow = {
  id: number;
  name: string;
  mobile: string;
  whatsapp?: string;
};

export default function CustomersPage() {
  return (
    <MasterCrudPage<CustomerRow>
      title="Customer"
      description="Manage customer master data"
      searchPlaceholder="Search by name or mobile..."
      fetchList={(search) => customersApi.list({ search, limit: 100 })}
      onCreate={(values) =>
        customersApi.create({
          name: values.name,
          mobile: values.mobile,
          whatsapp: values.whatsapp || values.mobile,
        })
      }
      onUpdate={(id, values) =>
        customersApi.update(id, {
          name: values.name,
          mobile: values.mobile,
          whatsapp: values.whatsapp || values.mobile,
        })
      }
      onDelete={(id) => customersApi.remove(id)}
      fields={[
        { name: "name", label: "Customer Name", required: true },
        { name: "mobile", label: "Mobile", required: true },
        { name: "whatsapp", label: "WhatsApp" },
      ]}
      columns={[
        { key: "name", header: "Customer Name", className: "font-medium" },
        { key: "mobile", header: "Mobile" },
        { key: "whatsapp", header: "WhatsApp" },
      ]}
    />
  );
}
