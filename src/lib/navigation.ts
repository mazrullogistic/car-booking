export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Bookings", href: "/admin/bookings", icon: "bookings" },
  {
    label: "Booking Payments",
    href: "/admin/booking-payments",
    icon: "payments",
  },
  {
    label: "Income & Expense",
    href: "/admin/income-expense",
    icon: "finance",
  },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
];

export const masterNavItems: NavItem[] = [
  { label: "States", href: "/admin/masters/states" },
  { label: "Cities", href: "/admin/masters/cities" },
  { label: "Car Types", href: "/admin/masters/car-types" },
  { label: "Drivers", href: "/admin/masters/drivers" },
  { label: "Vendors", href: "/admin/masters/vendors" },
  { label: "Cars", href: "/admin/masters/cars" },
  { label: "Customers", href: "/admin/masters/customers" },
  { label: "Users", href: "/admin/masters/users" },
  { label: "Roles", href: "/admin/masters/roles" },
];
