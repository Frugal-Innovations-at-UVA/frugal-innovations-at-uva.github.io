import Link from "next/link";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/lib/session";
import { listLocations, listMaterialRules, listPrinters, listRoutingRules } from "../../actions";
import ConfigView from "./ConfigView";

export default async function ConfigPage() {
  const authed = await hasValidSession();
  if (!authed) redirect("/queue/dashboard");

  const [locations, printers, routingRules, materialRules] = await Promise.all([
    listLocations(),
    listPrinters(),
    listRoutingRules(),
    listMaterialRules(),
  ]);

  return (
    <section className="queue-section">
      <div className="container">
        <Link className="queue-back-link" href="/queue/dashboard">
          ← Back to Dashboard
        </Link>
        <p className="queue-eyebrow">Admin Dashboard</p>
        <h1 className="title-lg">Printer Configuration</h1>
        <ConfigView
          initialLocations={locations}
          initialPrinters={printers}
          initialRoutingRules={routingRules}
          initialMaterialRules={materialRules}
        />
      </div>
    </section>
  );
}
