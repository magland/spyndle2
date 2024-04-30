import { BrowserRouter } from "react-router-dom";
import "./App.css";
import MainWindow from "./MainWindow";
import { SetupSpyndle } from "./SpyndleContext/SpyndleContext";

function App() {
  return (
    <BrowserRouter>
      <SetupSpyndle>
        <MainWindow />
      </SetupSpyndle>
    </BrowserRouter>
  );
}

export default App;
