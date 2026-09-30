import { ChatLayout } from "./components/ChatLayout";
import { LoginScreen } from "./components/LoginScreen";
import { useMessenger } from "./lib/useMessenger";

export default function App() {
  const messenger = useMessenger();

  if (!messenger.mode) {
    return (
      <LoginScreen
        connecting={messenger.connecting}
        error={messenger.error}
        onLogin={messenger.login}
        onDemo={messenger.enterDemo}
      />
    );
  }

  return <ChatLayout messenger={messenger} />;
}
