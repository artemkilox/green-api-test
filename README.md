# MAX-чат на GREEN-API

SPA на React + TypeScript: текстовые сообщения MAX через [GREEN-API](https://green-api.com/max).

Тестовое: https://green-api.com/v3/docs/api/sending/SendMessage/ и HTTP API `ReceiveNotification` / `DeleteNotification`.

## Локальный запуск

```bash
npm install
npm run dev
```

Открыть http://localhost:5173/

Сборка: `npm run build` и `npm run preview`.

## Как проверить (живой инстанс)

1. Зарегистрироваться в кабинете GREEN-API, создать инстанс MAX, авторизовать его QR-кодом из приложения MAX.
2. Скопировать `apiUrl`, `idInstance`, `apiTokenInstance`.
3. Войти в приложении, создать чат по номеру (метод `CheckAccount`), отправить текст.
4. Получатель отвечает в MAX — сообщение появляется в ленте (long-poll очереди GREEN-API).

При входе вызывается `SetSettings`: пустой `webhookUrl`, включены входящие и статусы отправки.

## Демо без инстанса

Кнопка «Демо без инстанса» на экране входа. Это локальная имитация (чаты, время, галочки, автоответ). **Не является выполнением сценария из тестового.** Для HR нужен реальный MAX.

## GitHub Pages

После пуша в `main` workflow `.github/workflows/pages.yml` собирает `dist` с `base: /green-api-test/`.

В репозитории: Settings → Pages → Source: **GitHub Actions**.

Адрес: `https://artemkilox.github.io/green-api-test/`

## CORS

Проверено 2026-09-30:

- `sendMessage`, `setSettings`, `receiveNotification`, `deleteNotification` на `https://api.green-api.com`: OPTIONS → `Access-Control-Allow-Origin: *`.
- `checkAccount` на том же общем хосте: OPTIONS **403**, заголовков CORS нет. Из браузера создание чата через этот URL не заведётся.
- `checkAccount` на хосте инстанса (`https://3100.api.green-api.com`): OPTIONS 204 и `Access-Control-Allow-Origin: *`.

В поле **apiUrl** нужно значение из кабинета GREEN-API, не общий `api.green-api.com`.

## Ограничения

- Только текст.
- История в `localStorage`.
- Живую переписку без кабинета GREEN-API проверить нельзя.
