import { Route, Routes } from 'react-router-dom';
import { ReactConfig } from '@react-shared';
import { DevParseErrorPage } from '@screens/dev-only/DevParseErrorPage/DevParseErrorPage';
import { POIStatusPage } from '@views/screens/pages/proof-of-innocence-status/POIStatusPage/POIStatusPage';
import { TabNavigator } from './TabNavigator/TabNavigator';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<TabNavigator />} />
      {ReactConfig.IS_DEV && (
        <Route path="/parse-error" element={<DevParseErrorPage />} />
      )}
      <Route path="/poi-status" element={<POIStatusPage />} />
    </Routes>
  );
};
