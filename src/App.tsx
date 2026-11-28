import { useMatch } from "react-router-dom";
import PoliceMascot from "./components/common/PoliceMascot";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const isLogin = useMatch("/login/*");
  const isRoleSelection = useMatch("/select-role");
  return (
    <>
      <AppRoutes />
      {isLogin || isRoleSelection ? null : <PoliceMascot />}
    </>
  );
}

export default App;
