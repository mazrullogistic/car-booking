"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
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
  Select,
} from "@/components/admin";

interface MasterCrudPageProps<T extends Record<string, unknown>> {
  title: string;
  description?: string;
  columns: Column<T>[];
  fetchList: (search: string) => Promise<T[]>;
  onCreate: (values: Record<string, string>) => Promise<unknown>;
  onUpdate: (id: number, values: Record<string, string>) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  fields: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  getEditValues?: (row: T) => Record<string, string>;
  searchPlaceholder?: string;
  renderExtra?: ReactNode;
  onOpenModal?: () => void;
}

export function MasterCrudPage<T extends Record<string, unknown>>({
  title,
  description,
  columns,
  fetchList,
  onCreate,
  onUpdate,
  onDelete,
  fields,
  getEditValues,
  searchPlaceholder = "Search records...",
  renderExtra,
  onOpenModal,
}: MasterCrudPageProps<T>) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchList(query));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchList, query]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    onOpenModal?.();
    setEditingId(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, ""])));
    setModalOpen(true);
  }

  function openEdit(row: T) {
    onOpenModal?.();
    const id = Number(row.id);
    setEditingId(id);
    setForm(
      getEditValues
        ? getEditValues(row)
        : Object.fromEntries(
            fields.map((f) => [f.name, String(row[f.name] ?? "")]),
          ),
    );
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await onUpdate(editingId, form);
      } else {
        await onCreate(form);
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
    if (!confirm("Delete this record?")) return;
    setError("");
    try {
      await onDelete(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const actionColumns: Column<T>[] = [
    ...columns,
    {
      key: "actions" as keyof T & string,
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(Number(row.id))}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={title} description={description}>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          Add New
        </Button>
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
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => setQuery(search)}>
              Search
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
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

      {renderExtra}

      <Card padding="none">
        <DataTable columns={actionColumns} data={data} loading={loading} />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? `Edit ${title}` : `Add ${title}`}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) =>
            field.options ? (
              <Select
                key={field.name}
                label={field.label}
                required={field.required}
                options={field.options}
                value={form[field.name] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
              />
            ) : (
              <Input
                key={field.name}
                label={field.label}
                type={field.type ?? "text"}
                required={field.required}
                value={form[field.name] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
              />
            ),
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
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
