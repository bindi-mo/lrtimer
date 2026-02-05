import Timer from './components/Timer';
import { TimerProvider } from './contexts/TimerContext.jsx';

function App() {
  return (
    <TimerProvider>
      <div>
        <Timer />
      </div>
    </TimerProvider>
  );
}

export default App;
