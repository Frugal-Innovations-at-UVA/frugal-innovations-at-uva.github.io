import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getPublicBoard } from "./actions";
import QueueBoard from "./QueueBoard";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("print_requests")
      .select("team_name, status");

    if (error || !data) throw error;

    const teams = new Set(data.map((r) => r.team_name)).size;
    const queue = data.filter((r) => r.status === "queue").length;
    const printing = data.filter((r) => r.status === "printing").length;

    return { total: data.length, teams, queue, printing };
  } catch {
    return { total: 0, teams: 0, queue: 0, printing: 0 };
  }
}

export default async function QueueLandingPage() {
  const [stats, board] = await Promise.all([getStats(), getPublicBoard()]);

  return (
    <>
      <section className="queue-hero">
        <div className="container">
          <p className="queue-eyebrow queue-eyebrow--light">Make-A-Thon 2026</p>
          <h1 className="title-xl title-xl--light">3D Print Queue</h1>
          <p className="queue-hero__subtitle">
            Submit your file, track your spot in line, and get it printed.
            Built for the Medical Device Make-A-Thon weekend.
          </p>
          <div className="queue-hero__actions">
            <Link className="queue-btn-accent" href="/queue/request">
              Submit a Print
            </Link>
            <Link className="queue-btn-outline" href="/queue/dashboard">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="queue-section">
        <div className="container">
          <p className="queue-eyebrow">Live Board</p>
          <h2 className="title-lg">Queue status</h2>
          <div className="queue-board-legend">
            <span><i className="queue-board-dot queue-board-dot--queue" /> Queue</span>
            <span><i className="queue-board-dot queue-board-dot--printing" /> Printing</span>
            <span><i className="queue-board-dot queue-board-dot--completed" /> Done</span>
          </div>
          <QueueBoard initialEntries={board} />
        </div>
      </section>

      <section className="queue-section queue-section--tint">
        <div className="container">
          <p className="queue-eyebrow">Live Status</p>
          <h2 className="title-lg">Queue at a glance</h2>
          <div className="queue-stats-grid">
            <div className="queue-stat-card">
              <div className="queue-stat-card__value">{stats.total}</div>
              <div className="queue-stat-card__label">Total Requests</div>
            </div>
            <div className="queue-stat-card">
              <div className="queue-stat-card__value">{stats.teams}</div>
              <div className="queue-stat-card__label">Teams</div>
            </div>
            <div className="queue-stat-card">
              <div className="queue-stat-card__value">{stats.queue}</div>
              <div className="queue-stat-card__label">In Queue</div>
            </div>
            <div className="queue-stat-card">
              <div className="queue-stat-card__value">{stats.printing}</div>
              <div className="queue-stat-card__label">Printing</div>
            </div>
          </div>
        </div>
      </section>

      <section className="queue-section">
        <div className="container">
          <p className="queue-eyebrow">Get Started</p>
          <h2 className="title-lg">Choose your path</h2>
          <div className="queue-directory-grid">
            <article className="queue-directory-card">
              <h3>Students</h3>
              <p>
                Submit your sliced .3mf file along with your team info,
                and we&apos;ll get it in the queue.
              </p>
              <Link className="btn primary" href="/queue/request">
                Submit a Print
              </Link>
            </article>
            <article className="queue-directory-card">
              <h3>Admins / Organizers</h3>
              <p>
                Log in to view the full queue, download files, and update
                print status as jobs move through.
              </p>
              <Link className="btn primary" href="/queue/dashboard">
                Open Dashboard
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
