"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Alert, Button, Card, DataTable, type Column, Input, PageHeader } from "@/components/admin";

interface ApiListPageProps<T extends Record<string, unknown>> {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  columns: Column<T>[];
  fetchData: (search: string) => Promise<T[]>;
  searchPlaceholder?: string;
  extraFilters?: React.ReactNode;
}

export function ApiListPage<T extends Record<string, unknown>>({
  title,
  description,
  action,
  columns,
  fetchData,
  searchPlaceholder = "Search records...",
  extraFilters,
}: ApiListPageProps<T>) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchData(query);
      setData(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchData, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title={title} description={description} action={action} />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {extraFilters}
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

      <Card padding="none">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm text-text-secondary">
            Showing{" "}
            <span className="font-medium text-text-primary">{data.length}</span>{" "}
            records
          </p>
        </div>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </>
  );
}
