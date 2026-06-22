"use client";

import { useEffect, useState } from "react";
import { MasterCrudPage } from "@/components/admin";
import {
  carTypesApi,
  carsApi,
  driversApi,
  vendorsApi,
} from "@/lib/services";

type CarRow = {
  id: number;
  car_number: string;
  ownership_type: string;
  vendor_id?: number;
  car_type_id?: number;
  driver_id?: number;
  vendor?: { name: string };
  carType?: { name: string };
  driver?: { name: string };
};

export default function CarsPage() {
  const [vendorOptions, setVendorOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [carTypeOptions, setCarTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [driverOptions, setDriverOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      vendorsApi.list({ limit: 200 }),
      carTypesApi.list({ limit: 200 }),
      driversApi.list({ limit: 200 }),
    ]).then(([vendors, carTypes, drivers]) => {
      setVendorOptions(
        vendors.map((v) => ({ value: String(v.id), label: v.name })),
      );
      setCarTypeOptions(
        carTypes.map((c) => ({ value: String(c.id), label: c.name })),
      );
      setDriverOptions(
        drivers.map((d) => ({ value: String(d.id), label: d.name })),
      );
    });
  }, []);

  return (
    <MasterCrudPage<CarRow>
      title="Car"
      description="Manage fleet vehicles"
      searchPlaceholder="Search by car number..."
      fetchList={(search) =>
        carsApi.list({ search, limit: 100 }) as Promise<CarRow[]>
      }
      onCreate={(values) =>
        carsApi.create({
          car_number: values.car_number,
          ownership_type: values.ownership_type,
          vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
          car_type_id: values.car_type_id ? Number(values.car_type_id) : null,
          driver_id: values.driver_id ? Number(values.driver_id) : null,
        })
      }
      onUpdate={(id, values) =>
        carsApi.update(id, {
          car_number: values.car_number,
          ownership_type: values.ownership_type,
          vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
          car_type_id: values.car_type_id ? Number(values.car_type_id) : null,
          driver_id: values.driver_id ? Number(values.driver_id) : null,
        })
      }
      onDelete={(id) => carsApi.remove(id)}
      getEditValues={(row) => ({
        car_number: row.car_number,
        ownership_type: row.ownership_type,
        vendor_id: String(row.vendor_id ?? ""),
        car_type_id: String(row.car_type_id ?? ""),
        driver_id: String(row.driver_id ?? ""),
      })}
      fields={[
        { name: "car_number", label: "Car Number", required: true },
        {
          name: "ownership_type",
          label: "Ownership",
          required: true,
          options: [
            { value: "own", label: "Own" },
            { value: "vendor", label: "Vendor" },
          ],
        },
        { name: "vendor_id", label: "Vendor", options: vendorOptions },
        { name: "car_type_id", label: "Car Type", options: carTypeOptions },
        { name: "driver_id", label: "Driver", options: driverOptions },
      ]}
      columns={[
        {
          key: "car_number",
          header: "Car Number",
          className: "font-medium",
        },
        {
          key: "ownership_type",
          header: "Ownership",
          render: (row) => row.ownership_type?.toUpperCase(),
        },
        {
          key: "carType",
          header: "Car Type",
          render: (row) => row.carType?.name ?? "-",
        },
        {
          key: "vendor",
          header: "Vendor",
          render: (row) => row.vendor?.name ?? "-",
        },
        {
          key: "driver",
          header: "Driver",
          render: (row) => row.driver?.name ?? "-",
        },
      ]}
    />
  );
}
