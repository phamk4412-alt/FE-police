import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { getClerkUserRole } from "../../utils/clerkRole";
import { ROLE_HOME_PATHS, ROLE_LABELS } from "../../utils/constants";
import { getRequiredIdentityStep } from "../../utils/identityVerification";
import type { UserRole } from "../../types/user";

const roles: UserRole[] = ["admin", "police", "user", "support"];

function SelectRole() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const [role, setRole] = useState<UserRole>("user");
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const existingRole = getClerkUserRole(user);
  const requiredIdentityStep = getRequiredIdentityStep(user?.id);

  if (requiredIdentityStep) {
    return <Navigate to={requiredIdentityStep} replace />;
  }

  if (existingRole) {
    return <Navigate to={ROLE_HOME_PATHS[existingRole]} replace />;
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    setIsSaving(true);
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        role,
      },
    });
    await user.reload();
    navigate(ROLE_HOME_PATHS[role], { replace: true });
  }

  return (
    <main className="login-page">
      <VietnameseDecor variant="auth" />
      <section className="login-hero">
        <h1>Chọn vai trò tài khoản</h1>
      </section>

      <section className="login-card">
        <div className="section-heading">
          <span className="eyebrow">Phân quyền</span>
          <h2>Thiết lập lần đầu</h2>
        </div>

        <label className="field" htmlFor="role">
          <span>Vai trò</span>
          <select
            id="role"
            onChange={(event) => setRole(event.target.value as UserRole)}
            value={role}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <Button disabled={isSaving} onClick={handleSave} type="button">
          {isSaving ? "Đang lưu..." : "Tiếp tục"}
        </Button>
      </section>
    </main>
  );
}

export default SelectRole;
