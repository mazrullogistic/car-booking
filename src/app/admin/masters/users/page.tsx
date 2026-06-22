"use client";

import { useEffect, useState } from "react";
import { MasterCrudPage } from "@/components/admin";
import { branchesApi, rolesApi, usersApi } from "@/lib/services";

type UserRow = {
  id: number;
  display_name: string;
  username: string;
  email: string;
  mobile?: string;
  branch_id?: number;
  role_id?: number;
  branch?: { id: number; name: string };
  role?: { id: number; name: string };
};

export default function UsersPage() {
  const [branchOptions, setBranchOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [roleOptions, setRoleOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      branchesApi.list({ limit: 100 }),
      rolesApi.list({ limit: 100 }),
    ]).then(([branches, roles]) => {
      setBranchOptions(
        branches.map((b) => ({ value: String(b.id), label: b.name })),
      );
      setRoleOptions(
        roles.map((r) => ({
          value: String(r.id),
          label: String(r.name ?? r.slug),
        })),
      );
    });
  }, []);

  return (
    <MasterCrudPage<UserRow>
      title="User"
      description="Manage system users"
      searchPlaceholder="Search by name, email, or mobile..."
      fetchList={(search) =>
        usersApi.list({ search, limit: 100 }) as Promise<UserRow[]>
      }
      onCreate={(values) =>
        usersApi.create({
          display_name: values.display_name,
          username: values.username,
          email: values.email,
          mobile: values.mobile || null,
          password: values.password,
          branch_id: values.branch_id ? Number(values.branch_id) : null,
          role_id: values.role_id ? Number(values.role_id) : null,
          tenant_id: 1,
        })
      }
      onUpdate={(id, values) => {
        const body: Record<string, unknown> = {
          display_name: values.display_name,
          username: values.username,
          email: values.email,
          mobile: values.mobile || null,
          branch_id: values.branch_id ? Number(values.branch_id) : null,
          role_id: values.role_id ? Number(values.role_id) : null,
        };
        if (values.password) body.password = values.password;
        return usersApi.update(id, body);
      }}
      onDelete={(id) => usersApi.remove(id)}
      getEditValues={(row) => ({
        display_name: row.display_name,
        username: row.username,
        email: row.email,
        mobile: row.mobile ?? "",
        branch_id: String(row.branch_id ?? row.branch?.id ?? ""),
        role_id: String(row.role_id ?? row.role?.id ?? ""),
        password: "",
      })}
      fields={[
        { name: "display_name", label: "Display Name", required: true },
        { name: "username", label: "Username", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "mobile", label: "Mobile" },
        { name: "password", label: "Password", type: "password" },
        { name: "branch_id", label: "Branch", options: branchOptions },
        { name: "role_id", label: "Role", options: roleOptions },
      ]}
      columns={[
        {
          key: "display_name",
          header: "Name",
          className: "font-medium",
        },
        { key: "username", header: "Username" },
        { key: "email", header: "Email" },
        {
          key: "branch",
          header: "Branch",
          render: (row) => row.branch?.name ?? "-",
        },
        {
          key: "role",
          header: "Role",
          render: (row) => row.role?.name ?? "-",
        },
      ]}
    />
  );
}
