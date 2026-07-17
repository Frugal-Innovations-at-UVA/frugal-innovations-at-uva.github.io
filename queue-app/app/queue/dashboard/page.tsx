import { hasValidSession } from "@/lib/session";
import { listRequests } from "../actions";
import LoginForm from "./LoginForm";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const authed = await hasValidSession();

  if (!authed) {
    return (
      <section className="queue-section">
        <div className="container queue-login-wrap">
          <p className="queue-eyebrow">TA Dashboard</p>
          <h1 className="title-lg">Log in</h1>
          <div className="queue-card">
            <LoginForm />
          </div>
        </div>
      </section>
    );
  }

  const requests = await listRequests();

  return (
    <section className="queue-section">
      <div className="container">
        <DashboardView initialRequests={requests} />
      </div>
    </section>
  );
}
