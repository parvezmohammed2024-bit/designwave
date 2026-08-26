"use client";

type Row = {
  name: string;
  phone: string;
  orders: number;
  lifetime: number;
  last: string;
  tags: string;
};

export default function CustomerExport({ rows }: { rows: Row[] }) {
  const download = () => {
    const header = "Name,Phone,Orders,Lifetime (BDT),Last order,Tags\n";
    const body = rows
      .map((r) =>
        [
          `"${r.name.replace(/"/g, '""')}"`,
          r.phone,
          r.orders,
          r.lifetime.toFixed(2),
          r.last.slice(0, 10),
          `"${r.tags}"`,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-wave-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
    >
      Export CSV ({rows.length})
    </button>
  );
}
