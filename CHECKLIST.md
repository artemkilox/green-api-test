# Чек-лист тестового (MAX + GREEN-API)

Не коммитить. Комментарии в коде не оставлять. Кабинета нет — живой MAX здесь не проверяли.

## Решение по «фейковому получателю»

- [x] Demo-режим только для UI (время, статусы, список чатов, автоответ).
- [x] Live-путь: CheckAccount → SendMessage → ReceiveNotification + DeleteNotification.
- [x] Баннер: демо ≠ приёмка HR.

## 0. CORS

- [x] OPTIONS POST sendMessage / setSettings: `Access-Control-Allow-Origin: *`.
- [x] GET receiveNotification, DELETE deleteNotification: `*`.
- [x] checkAccount на `api.green-api.com`: OPTIONS 403. На `3100.api.green-api.com`: 204 и `*`.
- [x] README + placeholder apiUrl с хоста инстанса.

## 1. Каркас SPA

- [x] Vite + React + TypeScript, `base` для GitHub Pages.
- [x] `.gitignore`, `pages.yml`, README.

## 2. API-клиент

- [x] apiUrl, idInstance, apiTokenInstance.
- [x] getStateInstance + setSettings (webhookUrl пустой).
- [x] checkAccount → chatId.
- [x] sendMessage.
- [x] receiveNotification + deleteNotification.
- [x] incomingMessageReceived и outgoingMessageStatus.

## 3. Состояние

- [x] Список чатов, создание чата, активный чат.
- [x] Время, статусы pending → sent → delivered → read / failed.
- [x] localStorage.
- [x] Восстановление live: setSettings.

## 4. UI

- [x] Логин / сайдбар / + чат / лента / ввод.
- [x] Пузыри, время, галочки.
- [x] Мобильный список/чат.
- [x] Фон ближе к web.max.ru.

## 5. Проверка

- [x] `npm run build`.
- [x] Браузер: логин, демо, отправка, автоответ, статусы, модалка нового чата.
- [ ] Live GREEN-API — нет кабинета.
- [ ] GitHub Pages после пуша — Settings → Pages → GitHub Actions.
