/**
 * Service Worker for NavHub
 * Provides offline support and caching
 */

const CACHE_NAME = "navhub-v3";
const APP_SHELL_URL = "/";

// 静态资源缓存列表
const STATIC_CACHE_URLS = ["/"];

// 安装事件 - 缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("[SW] Caching static resources");
        await Promise.all(
          STATIC_CACHE_URLS.map(async (url) => {
            try {
              await cache.add(url);
            } catch (error) {
              console.warn("[SW] Failed to precache resource:", url, error);
            }
          })
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 获取事件 - 处理请求
self.addEventListener("fetch", (event) => {
  // 只处理 GET 请求
  if (event.request.method !== "GET") {
    return;
  }

  // 跳过浏览器扩展请求
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  // 仅缓存同源请求，避免拦截跨域字体、图片和第三方资源
  let url;
  try {
    url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      return;
    }
  } catch {
    // ignore invalid URLs
    return;
  }

  // 对 _next/static/ 资源和导航请求使用 network-first 策略
  // 确保每次部署新版本时都能获取最新的 chunk
  if (url.pathname.startsWith("/_next/static/") || event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (event.request.mode === "navigate") {
              return caches.match(APP_SHELL_URL);
            }
            return new Response("Offline");
          });
        })
    );
    return;
  }

  // 其他同源请求使用 cache-first 策略
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return new Response("Offline");
        });
    })
  );
});

// 同步事件 - 处理后台同步
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-data") {
    event.waitUntil(
      // 这里可以实现后台同步逻辑
      Promise.resolve()
    );
  }
});

// 推送事件 - 处理推送通知
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
