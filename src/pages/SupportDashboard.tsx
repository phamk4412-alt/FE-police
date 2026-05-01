import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";

const supportRequests = [
  { id: "REQ-2101", title: "Need ambulance coordination", priority: "High", status: "Open" },
  { id: "REQ-2102", title: "Citizen follow-up call", priority: "Medium", status: "Waiting" },
  { id: "REQ-2103", title: "Verify report attachment", priority: "Low", status: "In review" },
];

const dispatchRows = [
  { unit: "Support A", area: "District 1", assignment: "Emergency handoff", eta: "8 min" },
  { unit: "Support B", area: "District 3", assignment: "Call verification", eta: "14 min" },
  { unit: "Support C", area: "District 7", assignment: "Report triage", eta: "22 min" },
];

function SupportDashboard() {
  return (
    <DashboardLayout role="support">
      <section className="page-title">
        <p className="eyebrow">Support Dashboard</p>
        <h2>Support coordination</h2>
        <span>Monitor support requests, map context, and dispatch readiness.</span>
      </section>

      <section className="dashboard-grid">
        <section className="panel" id="incidents">
          <div className="section-heading">
            <span className="eyebrow">Requests</span>
            <h2>Support queue</h2>
          </div>
          <div className="incident-list">
            {supportRequests.map((request) => (
              <article className="incident-item" key={request.id}>
                <div>
                  <strong>{request.title}</strong>
                  <span>{request.id}</span>
                </div>
                <div>
                  <span className="status-pill">{request.priority}</span>
                  <small>{request.status}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <span className="eyebrow">Dispatch</span>
            <h2>Mock coordination board</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Area</th>
                  <th>Assignment</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {dispatchRows.map((row) => (
                  <tr key={row.unit}>
                    <td>{row.unit}</td>
                    <td>{row.area}</td>
                    <td>{row.assignment}</td>
                    <td>{row.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <MapView title="Support dispatch map" />
    </DashboardLayout>
  );
}

export default SupportDashboard;
