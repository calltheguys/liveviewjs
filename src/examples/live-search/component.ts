import { SessionData } from "express-session";
import { html } from "../../server/templates";
import { LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, LiveViewSocket } from "../../server/component/types";
import { searchByZip, Store } from "./data";
import { BaseLiveViewComponent } from "../../server/component/base_component";


export interface SearchContext {
  zip: string;
  stores: Store[];
  loading: boolean;
}

export class SearchLiveViewComponent extends BaseLiveViewComponent<SearchContext, unknown> implements
  LiveViewExternalEventListener<SearchContext, "zip-search", Pick<SearchContext, "zip">>,
  LiveViewInternalEventListener<SearchContext, { type: "run_zip_search", zip: string }>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SearchContext>) {
    const zip = "";
    const stores: Store[] = [];
    const loading = false
    return { zip, stores, loading };
  };

  renderStoreStatus(store: Store) {
    if (store.open) {
      return html`<span class="open">🔓 Open</span>`;
    } else {
      return html`<span class="closed">🔐 Closed</span>`;
    }
  };

  renderStore(store: Store) {
    return html`
    <li>
      <div class="first-line">
        <div class="name">
          ${store.name}
        </div>
        <div class="status">
          ${this.renderStoreStatus(store)}
        </div>
        <div class="second-line">
          <div class="street">
            📍 ${store.street}
          </div>
          <div class="phone_number">
            📞 ${store.phone_number}
          </div>
        </div>
      </div>
    </li>`
  }

  renderLoading() {
    return html`
      <div class="loader">
        Loading...
      </div>
    `
  }

  render(context: SearchContext) {
    return html`
    <h1>Find a Store</h1>
    <div id="search">

      <form phx-submit="zip-search">
        <input type="text" name="zip" value="${context.zip}"
              placeholder="Zip Code"
              autofocus autocomplete="off"
              ${context.loading ? "readonly" : ""} />

        <button type="submit">
          🔎
        </button>
      </form>

      ${context.loading ? this.renderLoading() : ""}

      <div class="stores">
        <ul>
          ${context.stores.map(store => this.renderStore(store))}
        </ul>
      </div>
    </div>
    `
  };

  handleEvent(event: "zip-search", params: { zip: string }, socket: LiveViewSocket<SearchContext>) {
    const { zip } = params;
    // wait 100ms to send the message
    setTimeout(() => {
      socket.sendInternal({ type: "run_zip_search", zip });
    }, 100);

    return { zip, stores: [], loading: true };
  }

  handleInfo(event: { type: "run_zip_search", zip: string }, socket: LiveViewSocket<SearchContext>) {
    console.log("run_zip_search:", event);
    const { zip } = event;
    const stores = searchByZip(zip);
    return {
      zip,
      stores,
      loading: false
    }
  }

}

function calculateLicenseAmount(seats: number): number {
  if (seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}

