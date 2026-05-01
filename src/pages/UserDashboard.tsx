import type { FormEvent } from "react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import type { Incident } from "../types/incident";

const reportHistory: Incident[] = [
  {
    id: 501,
    title: "Lost wallet report",
    status: "Received",
    location: "District 1",
    createdAt: "2026-04-30 15:30",
  },
  {
    id: 502,
    title: "Street light outage",
    status: "Forwarded",
    location: "District 7",
    createdAt: "2026-04-29 18:45",
  },
];

function UserDashboard() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <DashboardLayout role="user">
      <section className="page-title">
        <p className="eyebrow">User Dashboard</p>
        <h2>Citizen report center</h2>
        <span>Submit incidents and follow your report history.</span>
      </section>

      <section className="dashboard-grid">
        <form className="panel report-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span className="eyebrow">Report</span>
            <h2>Submit incident</h2>
          </div>
          <Input label="Title" name="title" placeholder="Brief report title" />
          <Input label="Location" name="location" placeholder="Street, ward, district" />
          <label className="field" htmlFor="description">
            <span>Description</span>
            <textarea id="description" placeholder="Describe what happened" rows={5} />
          </label>
          <Button type="submit">Send report</Button>
        </form>

        <section className="panel" id="incidents">
          <div className="section-heading">
            <span className="eyebrow">History</span>
            <h2>Recent reports</h2>
          </div>
          <div className="incident-list">
            {reportHistory.map((report) => (
              <article className="incident-item" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{report.location}</span>
                </div>
                <div>
                  <span className="status-pill">{report.status}</span>
                  <small>{report.createdAt}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <MapView title="Incident location map" />
    </DashboardLayout>
  );
}

export default UserDashboard;
