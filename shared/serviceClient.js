import axios from "axios";
import { createBreaker } from "./circuitBreaker.js";
import { Unavailable } from "./errors.js";

export function createServiceClient(name, baseURL, log, options = {}) {
  const http = axios.create({
    baseURL,
    timeout: options.timeout ?? 8000,
    headers: { "Content-Type": "application/json" },
  });

  async function call({ method = "GET", url, data, params, headers = {} }) {
    const res = await http.request({ method, url, data, params, headers });
    return res.data;
  }

  const breaker = createBreaker(name, call, log, {
    timeout: options.timeout ?? 8000,
    fallback: options.fallback,
  });

  async function request(config) {
    try {
      return await breaker.fire(config);
    } catch (err) {
      if (err.response) {
        const e = new Error(err.response.data?.error?.message || "Upstream service error");
        e.statusCode = err.response.status;
        e.code = err.response.data?.error?.code || "UPSTREAM_ERROR";
        throw e;
      }
      log.error({ service: name, err: err.message }, "Service call failed");
      throw Unavailable(`${name} is temporarily unavailable`);
    }
  }

  return {
    get:  (url, cfg = {}) => request({ method: "GET", url, ...cfg }),
    post: (url, data, cfg = {}) => request({ method: "POST", url, data, ...cfg }),
    put:  (url, data, cfg = {}) => request({ method: "PUT", url, data, ...cfg }),
    patch:(url, data, cfg = {}) => request({ method: "PATCH", url, data, ...cfg }),
    del:  (url, cfg = {}) => request({ method: "DELETE", url, ...cfg }),
    breaker,
  };
}

export function forwardAuth(req) {
  return req.headers.authorization
    ? { headers: { Authorization: req.headers.authorization, "x-request-id": req.id } }
    : { headers: { "x-request-id": req.id } };
}
