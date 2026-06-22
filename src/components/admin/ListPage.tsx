"use client";

import { useMemo, useState } from "react";
import { Card } from "./Card";
import { DataTable, type Column } from "./DataTable";
import { Input } from "./Input";
import { PageHeader } from "./PageHeader";
import { Select } from "./Select";

interface ListPageProps<T extends Record<string, unknown>> {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  filters?: {
    key: keyof T;
    label: string;
    options: { value: string; label: string }[];
  }[];
}

export function ListPage<T extends Record<string, unknown>>({
  title,
  description,
  action,
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = "Search...",
  filters = [],
}: ListPageProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    let result = data;

    if (search.trim() && searchKeys.length > 0) {
      const query = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(query),
        ),
      );
    }

    for (const filter of filters) {
      const value = filterValues[String(filter.key)];
      if (value) {
        result = result.filter((row) => String(row[filter.key]) === value);
      }
    }

    return result;
  }, [data, search, searchKeys, filters, filterValues]);

  return (
    <>
      <PageHeader title={title} description={description} action={action} />

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
          {filters.map((filter) => (
            <div key={String(filter.key)} className="w-full sm:w-48">
              <Select
                label={filter.label}
                options={filter.options}
                value={filterValues[String(filter.key)] ?? ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    [String(filter.key)]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm text-text-secondary">
            Showing{" "}
            <span className="font-medium text-text-primary">
              {filteredData.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-text-primary">{data.length}</span>{" "}
            records
          </p>
        </div>
        <DataTable columns={columns} data={filteredData} />
      </Card>
    </>
  );
}
