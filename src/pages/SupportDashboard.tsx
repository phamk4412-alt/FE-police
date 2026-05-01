import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";

const supportRequests = [
  { id: "YC-2101", title: "Cần điều phối xe cứu thương", priority: "Cao", status: "Đang mở" },
  { id: "YC-2102", title: "Gọi lại xác minh với người dân", priority: "Trung bình", status: "Đang chờ" },
  { id: "YC-2103", title: "Kiểm tra tệp đính kèm báo cáo", priority: "Thấp", status: "Đang xem xét" },
];

const dispatchRows = [
  { unit: "Tổ hỗ trợ A", area: "Quận 1", assignment: "Chuyển tiếp khẩn cấp", eta: "8 phút" },
  { unit: "Tổ hỗ trợ B", area: "Quận 3", assignment: "Xác minh cuộc gọi", eta: "14 phút" },
  { unit: "Tổ hỗ trợ C", area: "Quận 7", assignment: "Phân loại báo cáo", eta: "22 phút" },
];

function SupportDashboard() {
  return (
    <DashboardLayout role="support">
      <section className="page-title">
        <p className="eyebrow">Bảng điều khiển hỗ trợ</p>
        <h2>Điều phối hỗ trợ</h2>
        <span>Theo dõi yêu cầu hỗ trợ, bối cảnh bản đồ và khả năng điều phối.</span>
      </section>

      <section className="dashboard-grid">
        <section className="panel" id="incidents">
          <div className="section-heading">
            <span className="eyebrow">Yêu cầu</span>
            <h2>Hàng đợi hỗ trợ</h2>
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
            <span className="eyebrow">Điều phối</span>
            <h2>Bảng điều phối mẫu</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Đơn vị</th>
                  <th>Khu vực</th>
                  <th>Nhiệm vụ</th>
                  <th>Dự kiến đến</th>
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

      <MapView title="Bản đồ điều phối hỗ trợ" />
    </DashboardLayout>
  );
}

export default SupportDashboard;
