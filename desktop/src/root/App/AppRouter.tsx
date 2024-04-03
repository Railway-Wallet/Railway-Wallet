import { BrowserRouter, HashRouter, RouteProps } from 'react-router-dom';
import { isElectron } from '@utils/user-agent';

export const AppRouter: React.FC<RouteProps> = ({ children }) => {
  if (isElectron()) {
    return <HashRouter>{children}</HashRouter>;
  } else {
    return <BrowserRouter>{children}</BrowserRouter>;
  }
};
