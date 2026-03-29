/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * 백그라운드 푸시 알림 수신 처리
 */

importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD8Urr5Q4DRI9kcx9jzvuBLRV4YpUzv6GY",
  authDomain: "kwonrishop-9de4e.firebaseapp.com",
  projectId: "kwonrishop-9de4e",
  messagingSenderId: "228092299501",
  appId: "1:228092299501:web:c25697547857c7d31da4e4",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 핸들러
messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || "권리샵";
  var body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || "";
  var link = (payload.data && payload.data.link) || "/";

  var options = {
    body: body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: { link: link },
    tag: "kwonrishop-" + Date.now(),
  };

  self.registration.showNotification(title, options);
});

// 알림 클릭 핸들러
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var link = (event.notification.data && event.notification.data.link) || "/";
  var url = self.location.origin + link;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        // 이미 열린 탭이 있으면 포커스
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // 없으면 새 탭
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
