"use client";

import { useCallback, useEffect, useState } from "react";
import { MasterCrudPage } from "@/components/admin";
import { citiesApi, statesApi } from "@/lib/services";

type CityRow = {
  id: number;
  name: string;
  state_id: number;
  state?: { id: number; name: string };
};

export default function CitiesPage() {
  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    statesApi.list({ limit: 200 }).then((states) =>
      setStateOptions(
        states.map((s) => ({ value: String(s.id), label: s.name })),
      ),
    );
  }, []);

  const fetchList = useCallback(
    (search: string) => citiesApi.list({ search, limit: 100 }),
    [],
  );

  return (
    <MasterCrudPage<CityRow>
      title="City"
      description="Manage city master data"
      searchPlaceholder="Search by city name..."
      fetchList={fetchList}
      onCreate={(values) =>
        citiesApi.create({
          name: values.name,
          state_id: Number(values.state_id),
        })
      }
      onUpdate={(id, values) =>
        citiesApi.update(id, {
          name: values.name,
          state_id: Number(values.state_id),
        })
      }
      onDelete={(id) => citiesApi.remove(id)}
      getEditValues={(row) => ({
        name: row.name,
        state_id: String(row.state_id ?? row.state?.id ?? ""),
      })}
      fields={[
        { name: "name", label: "City Name", required: true },
        {
          name: "state_id",
          label: "State",
          required: true,
          options: stateOptions,
        },
      ]}
      columns={[
        { key: "name", header: "City Name", className: "font-medium" },
        {
          key: "state",
          header: "State",
          render: (row) => row.state?.name ?? "-",
        },
      ]}
    />
  );
}
