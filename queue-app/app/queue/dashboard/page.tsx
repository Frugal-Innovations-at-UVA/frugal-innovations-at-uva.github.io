import Link from "next/link";
import { getSession } from "@/lib/session";
import { listLocations, listPrinters, listRequests } from "../actions";
import LoginForm from "./LoginForm";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="queue-section">
        <div className="container queue-login-wrap">
          <Link className="queue-back-link" href="/queue">
            ← Back to Queue
          </Link>
          <p className="queue-eyebrow">Admin Dashboard</p>
          <h1 className="title-lg">Log in</h1>
          <div className="queue-card">
            <LoginForm />
          </div>
        </div>
      </section>
    );
  }

  const [requests, locations, printers] = await Promise.all([
    listRequests(),
    listLocations(),
    listPrinters(),
  ]);

  return (
    <section className="queue-section">
      <div className="container">
        <DashboardView
          initialRequests={requests}
          initialLocations={locations}
          initialPrinters={printers}
          initialAdminName={session.name}
        />
      </div>
    </section>
  );
}
