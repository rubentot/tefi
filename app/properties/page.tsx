"use client";
import Link from "next/link";

const mockProperties = [
  { id: "property1", title: "Enebolig på Majorstuen", price: 7500000 },
  { id: "property2", title: "Leilighet på Grünerløkka", price: 5200000 },
  { id: "property3", title: "Rekkehus på Bekkestua", price: 6300000 },
];

export default function PropertiesPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Boliger til salgs</h1>
      <ul className="space-y-4">
        {mockProperties.map((prop) => (
          <li key={prop.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{prop.title}</div>
              <div className="text-muted-foreground">{prop.price.toLocaleString()} kr</div>
            </div>
            <Link
              href={`/personal-info?propertyId=${prop.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Gi bud
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}