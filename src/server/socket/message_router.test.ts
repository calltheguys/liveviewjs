import { SessionData } from "express-session";
import { WebSocket, RawData } from "ws";
import { BaseLiveViewComponent, LiveViewExternalEventListener, LiveViewMountParams, LiveViewRouter, LiveViewSocket } from "..";
import { html } from "../templates";
import { MessageRouter } from "./message_router";
import { mock } from "jest-mock-extended";
import { PhxClickPayload, PhxFlash, PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxLivePatchIncoming } from "./types";
import jwt from "jsonwebtoken";
import { StringPropertyValues } from "../component";


describe("test message router", () => {
  it("onMessage unknown message", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    try {
      mr.onMessage(ws, Buffer.from(JSON.stringify([])), router, "1234", "my signing string")
      fail("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("unknown message type")
    }
  })

  it("onMessage valid phx_join with url", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage valid phx_join with redirect", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { redirect: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage phx_join missing url or redirect", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", {})
    try {
      mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("no url or redirect in join message")
    }
  })

  it("onMessage phx_join unrouted url", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/noroute" })
    try {
      mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("no component found for")
    }
  })

  it("onMessage valid heartbeat", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // heartbeat requires a join first
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_hb)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage valid click event", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // click event requires a join first
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_click)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage no join before click event so no socket send", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_click)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage no join before live patch event so no socket send", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phxLivePatch)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage valid live patch event", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // live patch requires a join first
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phxLivePatch)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage valid leave event", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "phx_leave",
      {}
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phxLeave)), router, "1234", "my signing string")
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage unknown leave event", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "phx_leave",
      {}
    ]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phxLeave)), router, "1234", "my signing string")
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage unknown message throws error", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    // live patch requires a join first
    const phxUnknown = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "blahblah",
      {}
    ]
    try {
      mr.onMessage(ws, Buffer.from(JSON.stringify(phxUnknown)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("unexpected protocol event")
    }
  })

  it("shutdown unhealth component managers", () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // mark component as unhealthy
    const c = mr.topicComponentManager["lv:phx-AAAAAAAA"];
    if (c.isHealthy) {
      c.shutdown()
    }
    // now run another message
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
    mr.onMessage(ws, Buffer.from(JSON.stringify(phx_hb)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

})


interface TestLiveViewComponentContext {

}
class LiveViewComponent extends BaseLiveViewComponent<{}, {}> implements LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<TestLiveViewComponentContext>): TestLiveViewComponentContext {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}

const router: LiveViewRouter = {
  "/test": new LiveViewComponent()
}

interface NewPhxJoinOptions {
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null
}
const newPhxJoin = (csrfToken: string, signingSecret: string, options: NewPhxJoinOptions): PhxJoinIncoming => {
  const session: Partial<SessionData> = {
    csrfToken
  }
  const params: LiveViewMountParams = {
    _csrf_token: csrfToken,
    _mounts: 0
  }
  const url = options.url ?? options.redirect
  const jwtSession = jwt.sign(JSON.stringify(session), signingSecret)
  const jwtStatic = jwt.sign(JSON.stringify([]), signingSecret)
  return [
    "4",
    "4",
    "lv:phx-AAAAAAAA",
    "phx_join",
    {
      url,
      params,
      session: jwtSession,
      static: jwtStatic,
    }
  ]
}