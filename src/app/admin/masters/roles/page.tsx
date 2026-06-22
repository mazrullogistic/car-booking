"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  DataTable,
  type Column,
  Input,
  Modal,
  PageHeader,
} from "@/components/admin";
import { PERMISSION_KEYS, rolesApi } from "@/lib/services";

type RoleRow = {
  id: number;
  name: string;
  slug: string;
  scope_label?: string;
  permission_keys?: string[];
};

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [scopeLabel, setScopeLabel] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData((await rolesApi.list({ search: query, limit: 100 })) as RoleRow[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load roles");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setSlug("");
    setScopeLabel("");
    setPermissions([]);
    setModalOpen(true);
  }

  async function openEdit(row: RoleRow) {
    setEditingId(row.id);
    setName(row.name);
    setSlug(row.slug);
    setScopeLabel(row.scope_label ?? "");
    try {
      const role = await rolesApi.get(row.id);
      setPermissions(
        (role as RoleRow).permission_keys ??
          (role as { permissions?: { permission_key: string }[] }).permissions?.map(
            (p) => p.permission_key,
          ) ??
          [],
      );
    } catch {
      setPermissions(row.permission_keys ?? []);
    }
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name,
        slug,
        scope_label: scopeLabel || null,
        permissions,
      };
      if (editingId) {
        await rolesApi.update(editingId, body);
      } else {
        await rolesApi.create(body);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this role?")) return;
    try {
      await rolesApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  function togglePermission(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  const columns: Column<RoleRow>[] = [
    { key: "name", header: "Role Name", className: "font-medium" },
    { key: "slug", header: "Slug" },
    { key: "scope_label", header: "Scope" },
    {
      key: "permission_keys",
      header: "Permissions",
      render: (row) => `${row.permission_keys?.length ?? 0} permissions`,
    },
    {
      key: "actions" as keyof RoleRow & string,
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Roles" description="Manage roles and permissions">
        <Button onClick={openCreate}>Add New</Button>
      </PageHeader>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setQuery(search)}>Search</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setQuery("");
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Role" : "Add Role"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <Input
            label="Scope Label"
            value={scopeLabel}
            onChange={(e) => setScopeLabel(e.target.value)}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">
              Permissions
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {PERMISSION_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(key)}
                    onChange={() => togglePermission(key)}
                    className="rounded border-border"
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
