import { onRequest as __api_ping_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\api\\ping.js"
import { onRequest as __api_send_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\api\\send.js"
import { onRequest as __api_subscribe_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\api\\subscribe.js"
import { onRequest as __api_subscriptions_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\api\\subscriptions.js"
import { onRequest as __api_unsubscribe_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\api\\unsubscribe.js"
import { onRequest as __ping_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\ping.js"
import { onRequest as __send_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\send.js"
import { onRequest as __subscribe_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\subscribe.js"
import { onRequest as __subscriptions_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\subscriptions.js"
import { onRequest as __unsubscribe_js_onRequest } from "C:\\Users\\aquab\\work\\lrtimer\\functions\\unsubscribe.js"

export const routes = [
    {
      routePath: "/api/ping",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ping_js_onRequest],
    },
  {
      routePath: "/api/send",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_send_js_onRequest],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_subscribe_js_onRequest],
    },
  {
      routePath: "/api/subscriptions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_subscriptions_js_onRequest],
    },
  {
      routePath: "/api/unsubscribe",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_unsubscribe_js_onRequest],
    },
  {
      routePath: "/ping",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ping_js_onRequest],
    },
  {
      routePath: "/send",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__send_js_onRequest],
    },
  {
      routePath: "/subscribe",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__subscribe_js_onRequest],
    },
  {
      routePath: "/subscriptions",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__subscriptions_js_onRequest],
    },
  {
      routePath: "/unsubscribe",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__unsubscribe_js_onRequest],
    },
  ]