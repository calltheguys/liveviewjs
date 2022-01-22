import { LiveViewRouter } from "../liveview/types";
import { AutocompleteLiveViewComponent } from "./autocomplete/component";
import { LicenseLiveViewComponent } from "./license_liveview";
import { LightLiveViewComponent } from "./light_liveview";
import { SearchLiveViewComponent } from "./live-search/component";
import { SalesDashboardLiveViewComponent } from "./sales_dashboard_liveview";

export const router: LiveViewRouter = {
  "/license": new LicenseLiveViewComponent(),
  "/light": new LightLiveViewComponent(),
  '/sales-dashboard': new SalesDashboardLiveViewComponent(),
  '/search': new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
}