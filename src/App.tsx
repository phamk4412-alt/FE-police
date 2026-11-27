import { useMatch } from "react-router-dom";
import PoliceMascot from "./components/common/PoliceMascot";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const isLogin = useMatch("/login/*");
  return (
    <>
      <AppRoutes />
      {isLogin ? null : <PoliceMascot />}
    </>
  );
}

export default App;
